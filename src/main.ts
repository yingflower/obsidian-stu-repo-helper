import { App, Notice, Plugin, TAbstractFile, Platform} from 'obsidian';
import { KnowledgeBaseHelperSettings, DEFAULT_SETTINGS } from './settings';
import { KnowledgeBaseHelperSettingTab } from './settings';

export default class KnowledgeBaseHelperPlugin extends Plugin {
  settings: KnowledgeBaseHelperSettings;
	async onload() {
    this.addSettingTab(new KnowledgeBaseHelperSettingTab(this.app, this));
    await this.loadSettings();
    console.log('Student Knowledge Base Helper loaded');
    console.log('Settings:', this.settings);
    console.log('Platform isDesktop:', Platform.isDesktop);
    console.log('Platform isMobile:', Platform.isMobile);

    this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
        var isImages = isImageFiles(files)
        var isMarkdowns = isMarkdownFiles(files)
        if (isImages || isMarkdowns) {
          if (isImages) {
            menu.addItem((item) => {
              item.setTitle('Add to Note')
              .setIcon('document')
              .onClick(async() => {
                await createImagesNote(files)
              });
            });
          }
          if (isMarkdowns && Platform.isDesktop) {
            menu.addItem((item) => {
              item.setTitle('Generate Audio')
              .setIcon('document')
              .onClick(async() => {
                generateAudio(files, this.settings)
              });
            });
          }
        }
      })
    );

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
        var isImage = isFileImage(file.path)
        var isMarkdown = isFileMarkdown(file.path)
        if (isImage || isMarkdown) {
          if (isImage) {
            menu.addItem((item) => {
              item.setTitle('生成笔记')
              .setIcon('document')
              .onClick(async() => {
                var files = [file]
                //await createImagesNote(files)
                await imageToText(file, this.settings)
              });
            })
          }

          if (isMarkdown && Platform.isDesktop) {
            // Create Audio
            menu.addItem(item => {
              item
                .setTitle('生成音频')
                .setIcon('document')
                .onClick(async() => {
                  var files = [file]
                  generateAudio(files, this.settings)
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
              item.setTitle('文字识别')
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

function isFileMarkdown(path: string): boolean {
  return path.endsWith('.md')
}
function isMarkdownFiles(files: TAbstractFile[]): boolean {
  var j:any
  for (j in files) {
    var f_path = files[j].path
    if (!isFileMarkdown(f_path)) {
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

async function generateAudio(files: TAbstractFile[], settings: KnowledgeBaseHelperSettings) {
  const PathLib = require('path')
  const gTTS = require('node-gtts')
  

  var j:any
  for (j in files) {
    var new_path = files[j].basename + `_${j}`
    file = files[j]
    var md_content = await app.vault.read(file)
    //console.log(`read: ${md_content}`)
    var text = getPlainText(md_content)
    //console.log(`text: ${text}`)

    // Create output audio dir
    audio_path = PathLib.join(file.parent.path, settings.audioPath)
    console.log(`audio_path: ${audio_path}`)
    await app.vault.adapter.mkdir(audio_path)
    // Get output mp3 file path
    var abs_path = app.vault.adapter.getFullPath(file.path)
    var output_path = PathLib.dirname(abs_path)
    var output_fname = PathLib.basename(abs_path, PathLib.extname(abs_path))+'.mp3'
    var output_fpath = PathLib.join(output_path, settings.audioPath, output_fname)
    //console.log(output_fpath)

    // Generate TTS audio
    var gtts = new gTTS(settings.ttsLanguage, true)
    await gtts.save(output_fpath, text, (err, result) => {
      if (err) {
        throw new Error(err)
      }
      console.log(`Audio saved to ${output_fpath}`)
    })
    // Insert Audio file to the md content
    audio_fpath = PathLib.join(audio_path, output_fname)
    md_content = `\`\`\`audio-player\n [[${audio_fpath}]]\n\`\`\`\n` + md_content
    console.log(md_content)
    await app.vault.adapter.write(file.path, md_content)
  }
}

function getPlainText(markdown: string): string {
  // 删除代码段（包括行内代码和代码块）
  let plainText = markdown.replace(/`{1,3}[^`]*`{1,3}/g, '');
  plainText = plainText.replace(/```[\s\S]*?```/g, '');

  // 删除图片链接
  plainText = plainText.replace(/!\[.*?\]\(.*?\)/g, '');

  // 删除超链接
  plainText = plainText.replace(/\[.*?\]\(.*?\)/g, '');

  return plainText;
}

async function imageToText(file: TAbstractFile, settings: KnowledgeBaseHelperSettings): Promise<string> {
  const AipOcrClient = require('baidu-aip-sdk').ocr;
  try {
    const client = new AipOcrClient(settings.ocrSettings.appID, settings.ocrSettings.apiKey, settings.ocrSettings.apiSecret);
    // 读取图片文件并转换为 Base64 编码
    var image_content =  await app.vault.adapter.readBinary(file.path)
    var image = Buffer.from(image_content).toString('base64')

    // 调用百度云 OCR 的通用文字识别接口
    var options = {};
    options["language_type"] = "CHN_ENG";
    options["paragraph"] = "true";

    const result = await client.accurateBasic(image, options);
    console.log(JSON.stringify(result));
    // 提取识别结果中的文字
    let text = '';
    if (result.paragraphs_result) {
      result.paragraphs_result.forEach((item: { words_result_idx: number[] }) => {
        for (let i = 0; i < item.words_result_idx.length; i++) {
          text += result.words_result[item.words_result_idx[i]].words + ' ';
        }
        text += '\n';
      });
    }
    console.log('图片转文字段落结果:', text);
    return text;
  } catch (error) {
      console.error('图片转文字出错:', error);
      throw error;
  }
}