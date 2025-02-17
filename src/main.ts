import { App, Notice, Plugin, TAbstractFile, Platform} from 'obsidian';
import { StudentRepoSettings, DEFAULT_SETTINGS } from './settings';
import { StudentRepoSettingTab } from './settings';
import { textToSpeech, translateText } from "./ms_azure";
import { imageToText} from "./baidu_ai";
import { GENERATE_SIMILAR_TOPIC_TEMPLATE, GENERATE_LEARNING_POINTS_TEMPLATE, EXPLAIN_KNOWLEDGE_POINT_TEMPLATE } from './prompt'
import { sendLLMRequest } from './llm'

export default class StudentRepoPlugin extends Plugin {
  settings: StudentRepoSettings;
	async onload() {
    this.addSettingTab(new StudentRepoSettingTab(this.app, this));
    await this.loadSettings();
    console.log('Student Repository Helper loaded');
    console.log('Settings:', this.settings);
    console.log('Platform isDesktop:', Platform.isDesktop);
    console.log('Platform isMobile:', Platform.isMobile);

    this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
        var isImages = isImageFiles(files)
        if (isImages) {
          if (isImages) {
            menu.addItem((item) => {
              item.setTitle('学生知识库: 生成笔记')
              .setIcon('document')
              .onClick(async() => {
                await createImagesNote(files)
              });
            });
          }
        }
      })
    );

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
        var isImage = isFileImage(file.path)
        if (isImage) {
          if (isImage) {
            menu.addItem((item) => {
              item.setTitle('学生知识库: 生成笔记')
              .setIcon('document')
              .onClick(async() => {
                var files = [file]
                await createImagesNote(files)
              });
            })
          }
        }
			})
		);

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        if (Platform.isDesktop) {
          const selection = editor.getSelection();
          console.log('selection:', selection);
          const imageRegex = /!\[\[(.*?)\]\]/;
          const match = selection.match(imageRegex);
          if (match) {
            menu.addItem((item) => {
              item.setTitle('学生知识库: 文字识别')
              .setIcon('document')
              .onClick(async() => {
                let imageFile = match[1]
                console.log('文字识别:', imageFile);
                const file = await this.getLinkedFile(imageFile);
                if (!file) {
                  new Notice(`图片文件不存在: ${imageFile}`);
                } else {
                  let text = await imageToText(file, this.settings)
                  const corsor = editor.getCursor();
                  const nextLinePos = {line: corsor.line + 1, ch: 0};
                  editor.replaceRange(text, nextLinePos);
                }
              });
            })
          } else {
            // Create Audio
            menu.addItem(item => {
              item
                .setTitle('学生知识库: 生成音频')
                .setIcon('document')
                .onClick(async() => {
                  const { full_path, normalized_path } = await this.getAudioFilePath(view.file, this.settings)
                  console.time('textToSpeech')
                  //let audio_buffer = await textToSpeech(selection, this.settings.azureSettings.speechSubscriptionKey)
                  //await app.vault.adapter.writeBinary(normalized_path, audio_buffer)
                  await textToSpeech(selection, full_path, this.settings.azureSettings.speechSubscriptionKey, this.settings.speechSettings.speechVoice)
                  console.timeEnd('textToSpeech')
                  console.log(`Audio saved to ${normalized_path}`);
                  //let audio_fpath = await generateBaiduTTS(selection, view.file, this.settings)
                  let md_text = `\`\`\`audio-player\n [[${normalized_path}]]\n\`\`\`\n`
                  const startOffset = editor.getCursor('from');
                  const nextLinePos = {line: startOffset.line, ch: 0};
                  editor.replaceRange(md_text, nextLinePos);
                });
            })

            // Translate
            menu.addItem(item => {
              item
                .setTitle('学生知识库: 翻译')
                .setIcon('document')
                .onClick(async() => {
                  let translatedText = await translateText(selection, 'zh-Hans', this.settings.azureSettings.mtSubscriptionKey)
                  const endOffset = editor.getCursor('to');
                  editor.replaceRange(`(${translatedText})`, endOffset);
                });
            })

            // 题目扩展
            menu.addItem(item => {
              item
                .setTitle('学生知识库: 题目扩展')
                .setIcon('document')
                .onClick(async() => {
                  const prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{GRADE}', this.settings.stuSettings.grade).replace('{TOPIC}', selection);
                  const result = await sendLLMRequest(prompt, this.settings.llmSettings);
                  const endOffset = editor.getCursor('to');
                  const nextLinePos = {line: endOffset.line + 1, ch: 0};
                  editor.replaceRange(`${addQuoteToText(result)}\n`, nextLinePos);
                });
            })

            // 知识点分析
            menu.addItem(item => {
              item
                .setTitle('学生知识库: 知识点分析')
                .setIcon('document')
                .onClick(async() => {
                  const prompt = GENERATE_LEARNING_POINTS_TEMPLATE.replace('{TOPIC}', selection);
                  const result = await sendLLMRequest(prompt, this.settings.llmSettings);
                  const endOffset = editor.getCursor('to');
                  const nextLinePos = {line: endOffset.line + 1, ch: 0};
                  editor.replaceRange(`${addQuoteToText(result)}\n`, nextLinePos);
                });
            })

          }
        }
      })
    )
	}

  async getLinkedFile(link: string): Promise<TAbstractFile | null> {
    const file = this.app.metadataCache.getFirstLinkpathDest(link, '');
    if (!file) {
      return null;
    }
    return this.app.vault.getAbstractFileByPath(file.path);
  }

  async getAudioFilePath(tfile: TAbstractFile, settings: StudentRepoSettings): {full_path: string; normalized_path: string} {
    const PathLib = require('path')
    // Create output audio dir
    var audio_path = PathLib.join(tfile.parent.path, settings.speechSettings.speechOutputPath)
    //console.log(`audio_path: ${audio_path}`)
    await this.app.vault.adapter.mkdir(audio_path)
    // Get output mp3 file path
    var md_full_path = this.app.vault.adapter.getFullPath(tfile.path)
    //console.log(`md_full_path: ${md_full_path}`)
    var output_fname = PathLib.basename(md_full_path, PathLib.extname(md_full_path))+'.mp3'
    //console.log(`output_fname: ${output_fname}`)
    var full_path = PathLib.join(PathLib.dirname(md_full_path), settings.speechSettings.speechOutputPath, output_fname)
    //console.log(`output_full_path: ${full_path}`)
    var normalized_path = PathLib.join(audio_path, output_fname)
    //console.log(`normalized_path: ${normalized_path}`)

    return {full_path, normalized_path};
  }
	onunload() {
	}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

function isFileImage(path: string): boolean {
  return (
    path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
    path.endsWith('.webp') || path.endsWith('.gif') || path.endsWith('.bmp')
  )
}

function isImageFiles(files: TAbstractFile[]): boolean {
  var j:any
  for (j in files) {
    var f_path = files[j].path
    if (!isFileImage(f_path)) {
      return false
    }
  }
  return true
}

async function createNote(name: string, contents = ''): Promise<void> {
  try {
    let pathPrefix: string
    switch (app.vault.getConfig('newFileLocation')) {
      case 'current':
        pathPrefix = app.workspace.getActiveFile()?.parent?.path ?? ''
        break
      case 'folder':
        pathPrefix = app.vault.getConfig('newFileFolderPath') as string
        break
      default: // 'root'
        pathPrefix = ''
        break
    }
    
    if (pathPrefix) {
      pathPrefix += '/'
    }
    let path = `${pathPrefix}${name}`
    console.log(`pathPrefix: ${pathPrefix}, name: ${name}`)
    // Check if file already exists
    if (app.vault.getAbstractFileByPath(`${path}.md`)) {
      // Append a number to the end of the file name
      let i = 1
      while (await app.vault.getAbstractFileByPath(`${path} ${i}.md`)) {
        i++
      }
      path += ` ${i}`
    }

    // Create and open the file
    await app.vault.create(`${path}.md`, contents)
    await app.workspace.openLinkText(path, '')
  } catch (e) {
    new Notice('Text Extract - Could not create note: ' + (e as any).message)
    throw e
  }
}

async function createImagesNote(files: TAbstractFile[]) {
  var j:any
  var file_paths:string[] = new Array(files.length)
  for (j in files) {
    console.log(`ppath: ${files[j].parent.path}, pname: ${files[j].parent.name}`)
    file_paths[j] = files[j].path
  }
  file_paths.sort()
  var contents:string = ''
  for (j in file_paths) {
    console.log(file_paths[j])
    contents += `![[${file_paths[j]}]]\n`
  }
  console.log(contents)
  // Create a new note and open it
  await createNote("Untitled", contents)
}

function addQuoteToText(text: string): string {
  return '\n> [!NOTE]\n' + text.split('\n').map(line => `> ${line}`).join('\n')
}