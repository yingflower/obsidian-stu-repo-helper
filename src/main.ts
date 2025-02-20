import { App, Notice, Plugin, TAbstractFile, TFile, Platform, Editor, MarkdownView, normalizePath} from 'obsidian';
import { StudentRepoSettings, DEFAULT_SETTINGS } from './settings';
import { StudentRepoSettingTab } from './settings';
import { textToSpeechHttp, translateText, imageToText } from "./ms_azure";
import { checkAccessToken, imageToTextHttp } from "./baidu_ai";
import { GENERATE_SIMILAR_TOPIC_TEMPLATE, GENERATE_LEARNING_POINTS_TEMPLATE } from './prompt'
import { sendLLMRequest } from './llm'
import en from './locales/en'
import zh from './locales/zh-CN'

export default class StudentRepoPlugin extends Plugin {
  settings: StudentRepoSettings;
  trans: any;

  async onload() {
    const locale = window.localStorage.getItem('language')
    this.trans = locale?.startsWith('zh') ? zh : en;

    this.addSettingTab(new StudentRepoSettingTab(this.app, this));
    await this.loadSettings();
    console.log('Student Repository Helper loaded');
    console.log('Settings:', this.settings);
    console.log('Platform isDesktop:', Platform.isDesktop);
    console.log('Platform isMobile:', Platform.isMobile);
    console.log('Platform isWin:', Platform.isWin);

    this.registerFileMenu();
    this.registerEditorMenu();
    this.registerCommand();
	}

  registerFileMenu(): void {
    this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
        var isImages = isImageFiles(files)
        if (isImages) {
          if (isImages) {
            menu.addItem((item) => {
              item.setTitle(this.trans.createNodeFromImagesMenu)
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
              item.setTitle(this.trans.createNodeFromImageMenu)
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
  }

  async handleOcrRequest(imageFile: string, editor: Editor): Promise<void> {
    console.log('文字识别:', imageFile);
    const file = await this.getLinkedFile(imageFile);
    if (!file) {
      new Notice(`Image file not exist: ${imageFile}`);
    } else {
      var imageBuffer: ArrayBuffer =  await this.app.vault.adapter.readBinary(file.path)
      // 使用百度云提供的文字识别服务
      const isUpdate = await checkAccessToken(this.settings.ocrSettings);
      if (isUpdate) {
        await this.saveSettings();
      }
      const text = await imageToTextHttp(imageBuffer, this.settings.ocrSettings)
      // 使用微软提供的ocr服务
      //const text = await imageToText(imageBuffer, "tcI94DxwkS5q7eX9QjKsjtWsUNgu60m8BjpTmnVcx04nQdau7QdXJQQJ99BBAC3pKaRXJ3w3AAAFACOG2RC2")
      const corsor = editor.getCursor();
      const nextLinePos = {line: corsor.line + 1, ch: 0};
      editor.replaceRange(text, nextLinePos);
    }
  }

  async handleTextToSpeechRequest(text: string, mdFile: TFile, editor: Editor): Promise<void> {
    const { full_path, rel_path } = await this.getAudioFilePath(mdFile, this.settings)
    
    console.time('textToSpeech')
    let audio_buffer = await textToSpeechHttp(text, this.settings.azureSettings.speechSubscriptionKey, this.settings.speechSettings.speechVoice)
    await this.app.vault.adapter.writeBinary(rel_path, audio_buffer)
    //await textToSpeech(text, full_path, this.settings.azureSettings.speechSubscriptionKey, this.settings.speechSettings.speechVoice)
    console.timeEnd('textToSpeech')
    console.log(`Audio saved to ${rel_path}`);
    
    let md_text = `\`\`\`audio-player\n [[${rel_path}]]\n\`\`\`\n`
    const startOffset = editor.getCursor('from');
    const nextLinePos = {line: startOffset.line, ch: 0};
    editor.replaceRange(md_text, nextLinePos);
  }

  async handleTranslateTextRequest(text: string, editor: Editor): Promise<void> {
    let translatedText = await translateText(text, 'zh-Hans', this.settings.azureSettings.mtSubscriptionKey)
    const endOffset = editor.getCursor('to');
    editor.replaceRange(`(${translatedText})`, endOffset);
  }

  async handleGenSimilarTopicRequest(topic: string, editor: Editor): Promise<void> {
    const prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{GRADE}', this.settings.stuSettings.grade).replace('{TOPIC}', topic);
    const result = await sendLLMRequest(prompt, this.settings.llmSettings);
    const endOffset = editor.getCursor('to');
    const nextLinePos = {line: endOffset.line + 1, ch: 0};
    editor.replaceRange(`${addQuoteToText(result, this.trans.similarTopics)}\n\n`, nextLinePos);
  }

  async handleGenLearningPointRequest(topic: string, editor: Editor): Promise<void> {
    const prompt = GENERATE_LEARNING_POINTS_TEMPLATE.replace('{TOPIC}', topic);
    const result = await sendLLMRequest(prompt, this.settings.llmSettings);
    const endOffset = editor.getCursor('to');
    const nextLinePos = {line: endOffset.line + 1, ch: 0};
    editor.replaceRange(`${addQuoteToText(result, this.trans.learningPoints)}\n\n`, nextLinePos);
  }

  registerEditorMenu(): void {
    if (!Platform.isDesktop) {
      return;
    }
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        const imageRegex = /!?\[?\[?(.*\.(jpg|jpeg|png|bmp))\]?\]?/;
        const match = selection.match(imageRegex);
        if (match) {
          menu.addItem((item) => {
            item.setTitle(this.trans.imageToTextMenu)
            .setIcon('document')
            .onClick(async() => {
              let imageFile = match[1]
              this.handleOcrRequest(imageFile, editor);
            });
          })
        } else {
          // Create Audio
          menu.addItem(item => {
            item
              .setTitle(this.trans.textToSpeechMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleTextToSpeechRequest(selection, view.file, editor)
              });
          })

          // Translate
          menu.addItem(item => {
            item
              .setTitle(this.trans.translateTextMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleTranslateTextRequest(selection, editor);
              });
          })

          // 题目扩展
          menu.addItem(item => {
            item
              .setTitle(this.trans.genSimilarTopicsMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleGenSimilarTopicRequest(selection, editor);
              });
          })

          // 知识点分析
          menu.addItem(item => {
            item
              .setTitle(this.trans.genLearningPointsMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleGenLearningPointRequest(selection, editor);
              });
          })
        }

      })
    )
  }

  registerCommand(): void {
    this.addCommand({
      id: 'translate',
      name: this.trans.translateText,
      icon: "languages",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        this.handleTranslateTextRequest(selection, editor);
      }
    });

    this.addCommand({
      id: 'text_to_speech',
      name: this.trans.textToSpeech,
      icon: "activity",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        this.handleTextToSpeechRequest(selection, view.file, editor);
      }
    });

    this.addCommand({
      id: 'gen_learning_point',
      name: this.trans.analysisAndSummarize,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        this.handleGenSimilarTopicRequest(selection, editor);
        this.handleGenLearningPointRequest(selection, editor);
      }
    });

    this.addCommand({
      id: 'image_to_text',
      name: this.trans.imageToText,
      icon: "type",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        const imageRegex = /!?\[?\[?(.*\.(jpg|jpeg|png|bmp))\]?\]?/;
        const match = selection.match(imageRegex);
        if (match) {
          let imageFile = match[1]
          this.handleOcrRequest(imageFile, editor);
        } else {
          new Notice(`图片匹配失败: ${selection}`);
        }
      }
    });
  }

  async getLinkedFile(link: string): Promise<TFile | null> {
    const file = this.app.metadataCache.getFirstLinkpathDest(link, '');
    if (!file) {
      return null;
    }
    return this.app.vault.getAbstractFileByPath(file.path);
  }

  async getAudioFilePath(tfile: TFile, settings: StudentRepoSettings): {full_path: string; rel_path: string} {
    // Create output audio dir
    const audio_path = normalizePath(`${tfile.parent.path}/${settings.speechSettings.speechOutputPath}`)
    //console.log(`audio_path: ${audio_path}`)
    await this.app.vault.adapter.mkdir(audio_path)
    // Get output mp3 file path
    var audio_full_path = this.app.vault.adapter.getFullPath(audio_path)
    //console.log(`audio_full_path: ${audio_full_path}`)
    const output_fname = tfile.basename + '.mp3';
    //console.log(`output_fname: ${output_fname}`)

    const full_path = normalizePath(`${audio_full_path}/${output_fname}`);
    //console.log(`full_path: ${full_path}`)
    const rel_path = normalizePath(`${audio_path}/${output_fname}`);
    //console.log(`rel_path: ${rel_path}`)
    
    return {full_path, rel_path};
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

function isImageFiles(files: TFile[]): boolean {
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

async function createImagesNote(files: TFile[]) {
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

function addQuoteToText(text: string, note: string): string {
  return `\n> [!NOTE] ${note}\n` + text.split('\n').map(line => `> ${line}`).join('\n')
}