import { App, Notice, Plugin, TAbstractFile, TFile, Platform, Editor, MarkdownView, normalizePath } from 'obsidian';
import { StudentRepoSettings, DEFAULT_SETTINGS } from './settings';
import { StudentRepoSettingTab } from './settings';
import { textToSpeechHttp } from "./ms_azure";
import { checkAccessToken, imageToTextHttp, translateTextHttp } from "./baidu_ai";
import { 
  GENERATE_SIMILAR_TOPIC_TEMPLATE,
  GENERATE_LEARNING_POINTS_TEMPLATE,
  GENERATE_WORD_PHONETICS_TEMPLATE,
  GENERATE_LEARNING_POINTS_TEMPLATE_EN,
  GENERATE_SIMILAR_TOPIC_TEMPLATE_EN,
  SYNTAX_ANALYSIS_TEMPLATE
} from './prompt'

import { sendLLMRequest } from './llm'
import en from './locales/en'
import zh from './locales/zh-CN'



export default class StudentRepoPlugin extends Plugin {
  settings: StudentRepoSettings;
  trans: any;
  isLangZh: boolean;;

  async onload() {
    const locale = window.localStorage.getItem('language')
    this.isLangZh = locale?.startsWith('zh') ?? false;
    this.trans = this.isLangZh ? zh : en;

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
        const isImage = isFileImage(file.path)
        if (isImage) {
          menu.addItem((item) => {
            item.setTitle(this.trans.createNodeFromImageMenu)
            .setIcon('document')
            .onClick(async() => {
              var files = [file]
              await createImagesNote(files)
            });
          })
          menu.addItem((item) => {
            item.setTitle(this.trans.imageToTextMenu)
            .setIcon('document')
            .onClick(async() => {
              const view = this.app.workspace.getActiveViewOfType(MarkdownView);
              if (view) {
                await this.handleOcrRequest(file.path, view.editor);
              }
            });
          })
        }
			})
		);
  }

  async handleOcrRequest(imageFile: string, editor: Editor, line: number = -1): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.imageToTexting);
    console.log('文字识别:', imageFile);
    try {
      const file = await this.getLinkedFile(imageFile);
      if (!file) {
        new Notice(`Image file not exist: ${imageFile}`);
      } else {
        if (this.isLangZh) {
          new Notice(`将<${imageFile}>转成文字`);
        } else {
          new Notice(`Convert <${imageFile}> to text`);
        }
        var imageBuffer: ArrayBuffer =  await this.app.vault.adapter.readBinary(file.path)
        // 使用百度云提供的文字识别服务
        const isUpdate = await checkAccessToken(this.settings.ocrSettings);
        if (isUpdate) {
          await this.saveSettings();
        }
        const text = await imageToTextHttp(imageBuffer, this.settings.ocrSettings)
        // 使用微软提供的ocr服务
        //const text = await imageToText(imageBuffer, "tcI94DxwkS5q7eX9QjKsjtWsUNgu60m8BjpTmnVcx04nQdau7QdXJQQJ99BBAC3pKaRXJ3w3AAAFACOG2RC2")
        if (line < 0) {
          line = editor.getCursor().line + 1;
        }
        const nextLinePos = {line: line, ch: 0};
        editor.replaceRange(`${text}\n`,nextLinePos);
        editor.setCursor(nextLinePos);
        editor.scrollIntoView({from: {line, ch: 0}, to: {line: line + 20, ch: 0}});
      }
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handleImagesToTextRequest(mdFile: TFile, editor: Editor): Promise<void> {

    // Parse md file, get all image links
    const mdContent = await this.app.vault.read(mdFile);
    const lines = mdContent.split('\n');
    const imageRegex = /!\[\[(.*\.(jpg|jpeg|png|bmp))\]\]/;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const match = line.match(imageRegex);
      if (match) {
          const imagePath = match[1];
          console.log(`Image match: ${imagePath} in line ${i}`)
          await this.handleOcrRequest(imagePath, editor, i + 1);
      }
    }
  }

  async handleTextToSpeechRequest(text: string, mdFile: TFile, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.textToSpeeching);
    try {
      const { full_path, rel_path } = await this.getAudioFilePath(mdFile, this.settings)
      text = removeMarkdownTags(text);
      
      console.time('textToSpeech')
      let audio_buffer = await textToSpeechHttp(text, this.settings.speechSettings.subscriptionKey, this.settings.speechSettings.speechVoice)
      await this.app.vault.adapter.writeBinary(rel_path, audio_buffer)
      //await textToSpeech(text, full_path, this.settings.speechSettings.subscriptionKey, this.settings.speechSettings.speechVoice)
      console.timeEnd('textToSpeech')
      console.log(`Audio saved to ${rel_path}`);
      
      let md_text = `\`\`\`audio-player\n [[${rel_path}]]\n\`\`\`\n`
      const startOffset = editor.getCursor('from');
      const nextLinePos = {line: startOffset.line, ch: 0};
      editor.replaceRange(md_text, nextLinePos);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handleTranslateTextRequest(text: string, editor: Editor): Promise<void> {
    // 使用微软的机器翻译服务
    //let translatedText = await translateText(text, this.settings.stuSettings.localLanguage, this.settings.mtSettings.subscriptionKey)
    // 使用百度云提供的机器翻译服务
    const isUpdate = await checkAccessToken(this.settings.ocrSettings);
    if (isUpdate) {
      await this.saveSettings();
    }
    let toLang = this.settings.stuSettings.localLanguage === 'zh-Hans' ? 'zh' : 'en';
    const translatedText = await translateTextHttp(text, toLang, this.settings.ocrSettings)
    const endOffset = editor.getCursor('to');
    editor.replaceRange(`(${translatedText})`, endOffset);
  }

  async handleAddToWordBankRequest(word: string, editor: Editor): Promise<void> {
    const prompt = GENERATE_WORD_PHONETICS_TEMPLATE.replace('{WORD}', word);
    var phonetics = await sendLLMRequest(prompt, this.settings.llmSettings);
    if (!phonetics.startsWith('/')) {
      phonetics = `/${phonetics}/`;
    }
    //const translatedText = await translateText(word, this.settings.stuSettings.localLanguage, this.settings.mtSettings.subscriptionKey)
    // 使用百度云提供的机器翻译服务
    const isUpdate = await checkAccessToken(this.settings.ocrSettings);
    if (isUpdate) {
      await this.saveSettings();
    }
    let toLang = this.settings.stuSettings.localLanguage === 'zh-Hans' ? 'zh' : 'en';
    const translatedText = await translateTextHttp(word, toLang, this.settings.ocrSettings)
    const lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);
    if (lastLineText.startsWith(' - ')) {
      editor.setLine(lastLine + 1, `\n - ${word} ${phonetics} ${translatedText}`);
    } else {
      editor.setLine(lastLine + 1, `\n\n Word Bank \n - ${word} ${phonetics}  ${translatedText}`);
    }
  }

  async handleSyntaxAnalysisRequest(text: string, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText("思考中...");
    try {
      const prompt = SYNTAX_ANALYSIS_TEMPLATE.replace('{TEXT}', text);
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const lastLine = editor.lastLine();
      const displayText = `\n${text}\n\n ${result}`;
      editor.setLine(lastLine + 1, `${addQuoteToText(displayText, this.trans.syntaxAnalysis)}\n\n`);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handleGenSimilarTopicRequest(topic: string, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText("思考中...");
    try {
      var prompt = '';
      if (this.settings.stuSettings.localLanguage === 'zh-Hans') {
        prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{GRADE}', this.settings.stuSettings.grade).replace('{TOPIC}', topic).replace('{LANGUAGE}', '中文');
      } else {
        prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE_EN.replace('{GRADE}', this.settings.stuSettings.grade).replace('{TOPIC}', topic).replace('{LANGUAGE}', 'English');
      }
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      editor.replaceRange(`${addQuoteToText(result, this.trans.similarTopics)}\n\n`, nextLinePos);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handleGenLearningPointRequest(topic: string, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.thinking);
    try {
      var prompt = '';
      if (this.settings.stuSettings.localLanguage === 'zh-Hans') {
        prompt = GENERATE_LEARNING_POINTS_TEMPLATE.replace('{TOPIC}', topic).replace('{LANGUAGE}', '中文');
      } else {
        prompt = GENERATE_LEARNING_POINTS_TEMPLATE_EN.replace('{TOPIC}', topic).replace('{LANGUAGE}', 'English');
      }
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      editor.replaceRange(`${addQuoteToText(result, this.trans.learningPoints)}\n\n`, nextLinePos);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handlePluginUpdate(): Promise<void> {
    if (await this.app.vault.adapter.exists('plugins')) {
      const listFiles = await this.app.vault.adapter.list('plugins');
      for (let i = 0; i < listFiles.folders.length; i++) {
        const plugin = listFiles.folders[i];
        const pluginInstallPath = normalizePath(`.obsidian/${plugin}`);
        if (await this.app.vault.adapter.exists(pluginInstallPath)) {
        await this.app.vault.adapter.rmdir(pluginInstallPath, true);
          await this.app.vault.adapter.mkdir(pluginInstallPath);
        }
        const pluginFiles = await this.app.vault.adapter.list(plugin);
        for (let j = 0; j< pluginFiles.files.length; j++) {
          const pluginFile = pluginFiles.files[j];
          let fileName = this.app.vault.getAbstractFileByPath(pluginFile)?.name;
          let dstFilePath = normalizePath(`${pluginInstallPath}/${fileName}`);
          await this.app.vault.adapter.copy(`${pluginFile}`, dstFilePath);
        }
        
        //await this.app.vault.adapter.copy(`${plugin}`, `${pluginInstallPath}`);
        console.log(`${plugin} install to ${pluginInstallPath}`);
      }
      const statusBarItem = this.addStatusBarItem();
      new Notice('插件更新完成');
      statusBarItem.setText('插件更新完成');
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
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

        if (!match) {
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

          // 加单词库
          menu.addItem(item => {
            item
              .setTitle(this.trans.addWordBankMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleAddToWordBankRequest(selection, editor);
              });
          })
          // 语法分析
          menu.addItem(item => {
            item
              .setTitle(this.trans.syntaxAnalysisMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleSyntaxAnalysisRequest(selection, editor);
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
      id: 'word_bank',
      name: this.trans.addWordBank,
      icon: "rss",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        this.handleAddToWordBankRequest(selection, editor);
      }
    });
    this.addCommand({
      id: 'syntax_analysis',
      name: this.trans.syntaxAnalysis,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        console.log('selection:', selection);
        this.handleSyntaxAnalysisRequest(selection, editor);
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
          if (view) {
            this.handleImagesToTextRequest(view.file, editor);
          }
        }
      }
    });

    this.addCommand({
      id: 'plugin_update',
      name: "Plugin Update",
      icon: "arrow-up",
      callback: async () => {
        this.handlePluginUpdate();
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
    if (!await this.app.vault.adapter.exists(audio_path)) {
      await this.app.vault.adapter.mkdir(audio_path)
    }
    // Get output mp3 file path
    var audio_full_path = this.app.vault.adapter.getFullPath(audio_path)
    //console.log(`audio_full_path: ${audio_full_path}`)
    var full_path = '';
    var rel_path = '';
    var i = 0;
    do {
      var output_fname = ''
      if (i > 0) {
        output_fname = `${tfile.basename}_${i}.mp3`;
      } else {
        output_fname = `${tfile.basename}.mp3`;
      }
      
      //console.log(`output_fname: ${output_fname}`)

      full_path = normalizePath(`${audio_full_path}/${output_fname}`);
      //console.log(`full_path: ${full_path}`)
      rel_path = normalizePath(`${audio_path}/${output_fname}`);
      //console.log(`rel_path: ${rel_path}`)
      i++;
    } while (await this.app.vault.adapter.exists(rel_path));
    
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

function isFileMarkdown(path: string): boolean {
  return path.endsWith('.md')
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

function removeMarkdownTags(text: string): string {
  // 去除标题标记
  text = text.replace(/^(#+)\s/gm, '');
  // 去除加粗、斜体等标记
  text = text.replace(/(\*\*|__|_|\*)/g, '');
  // 去除列表标记
  text = text.replace(/^([-*+]\s|\d+\.\s)/gm, '');
  // 去除代码块标记
  text = text.replace(/```[\s\S]*?```/g, '');
  // 去除行内代码标记
  text = text.replace(/`([^`]*)`/g, '$1');
  // 去除链接和图片标记
  text = text.replace(/!?\[[^\]]*\]\([^)]*\)/g, '');
  // 去除水平线
  text = text.replace(/^---+$/gm, '');
  // 去除 HTML 标签
  text = text.replace(/<[^>]*>/g, '');
  return text;
}