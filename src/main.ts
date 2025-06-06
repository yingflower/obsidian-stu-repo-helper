import { 
  App, 
  Notice, 
  Plugin,
  TAbstractFile, 
  TFile, 
  Platform, 
  Editor,
  MarkdownView,
  normalizePath
} from 'obsidian';
import { StudentRepoSettings, DEFAULT_SETTINGS } from './settings';
import { StudentRepoSettingTab } from './settings';
import { textToSpeechHttp } from "./ms_azure";
import { checkAccessToken, imageToTextHttp } from "./baidu_ai";
import { 
  GENERATE_SIMILAR_TOPIC_TEMPLATE,
  GENERATE_LEARNING_POINTS_TEMPLATE,
  GEN_QUESTION_ANSWER_TEMPLATE,
  GENERATE_WORD_PHONETICS_TEMPLATE,
  SYNTAX_ANALYSIS_TEMPLATE,
  TEXT_TRANSLATE_TEMPLATE
} from './prompt'

import { genPaintingAnalysis, sendLLMRequest } from './llm'
import en from './locales/en'
import zh from './locales/zh-CN'

export default class StudentRepoPlugin extends Plugin {
  settings: StudentRepoSettings;
  trans: Record<string, string>;
  isLangZh: boolean;

  async onload() {
    const locale = window.localStorage.getItem('language')
    this.isLangZh = locale?.startsWith('zh') ?? false;
    this.trans = this.isLangZh ? zh : en;

    this.addSettingTab(new StudentRepoSettingTab(this.app, this));
    await this.loadSettings();
    console.debug('Student Repository Helper loaded');

    this.registerFileMenu();
    this.registerEditorMenu();
    this.registerCommand();
	}

  registerFileMenu(): void {
    this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
        let isImages = isImageFiles(files)
        if (isImages) {
          if (isImages) {
            menu.addItem((item) => {
              item.setTitle(this.trans.createNodeFromImagesMenu)
              .setIcon('document')
              .onClick(async() => {
                console.debug('Create note from images');
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
              let files = [file]
              console.debug('Create note from image');
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
          menu.addItem((item) => {
            item.setTitle(this.trans.paintingAnalysisMenu)
            .setIcon('document')
            .onClick(async() => {
              const view = this.app.workspace.getActiveViewOfType(MarkdownView);
              if (view) {
                await this.handlePaintingAnalysisRequest(file.path, view.editor);
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
        let imageBuffer: ArrayBuffer =  await this.app.vault.adapter.readBinary(file.path)
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
      
      //console.time('textToSpeech')
      const audio_buffer = await textToSpeechHttp(text, this.settings.speechSettings.subscriptionKey, this.settings.speechSettings.speechVoice)
      await this.app.vault.adapter.writeBinary(rel_path, audio_buffer)
      //console.timeEnd('textToSpeech')
      //console.debug(`Audio saved to ${rel_path}`);
      
      //const md_text = `\`\`\`audio-player\n [[${rel_path}]]\n\`\`\`\n`
      const md_text = `![[${rel_path}]]\n`
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
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.thinking);
    try {
      const prompt = TEXT_TRANSLATE_TEMPLATE.replace('{LANGUAGE}', this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English').replace('{TEXT', text).replace('{CONTEXT}', getCurrentContext(editor));
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      editor.replaceRange(`(${result})`, endOffset);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async getWordBankFile(): Promise<AbstractFile> {
    let wordBankFile: AbstractFile = null
    if (this.settings.stuSettings.wordBankFile) {
      wordBankFile = this.app.vault.getAbstractFileByPath(this.settings.stuSettings.wordBankFile);
    }

    if (!wordBankFile) {
      // Find word bank file
      const files = this.app.vault.getFiles();
      for (const file of files) {
        if (file.name === 'Word Bank.md') {
          //console.debug(`Word Bank file found: ${file.path}`);
          wordBankFile = file;
          break;
        }
      }
      // Create word bank file
      if (!wordBankFile) {
        //console.debug(`Word Bank file not found, create it`);
        wordBankFile = await createNote('Word Bank', '', false);
      }
      this.settings.stuSettings.wordBankFile = wordBankFile.path;
      this.saveSettings();
    }
    return wordBankFile;
  }

  async addToWordBank(text: string, source: TFile, blockId: string): Promise<void> {
    const wordBankFile = await this.getWordBankFile();
    const curDate = getCurrentDate();
  
    let content = await this.app.vault.read(wordBankFile);
    let wordStr = '';
    const lines = content.split('\n');

    let lastDate = '';
    let strimLength = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('###')) {
        if (lastDate.length == 0) {
          lastDate = line.split('###')[1].trim();
          if (lastDate !== curDate) {
            wordStr += `### ${curDate}\n`;
            wordStr += ` - ${text} ([[${source.name}#^${blockId} | ${source.basename}]]) \n`;
            break;
          }
        } else {
          wordStr += ` - ${text} ([[${source.name}#^${blockId} | ${source.basename}]]) \n`;
          break;
        }
      }

      if (i == lines.length - 1) {
        if (lastDate.length == 0) {
          wordStr += `### ${curDate}\n`;
        }
        wordStr += ` - ${text} ([[${source.name}#^${blockId} | ${source.basename}]])`;
      }
      wordStr += `${line}\n`;
      strimLength += line.length + 1;
    }

    content = content.substring(strimLength);
    wordStr += content.trim();

    await this.app.vault.modify(wordBankFile, `${wordStr}`);
  }

  async handleAddToWordBankRequest(word: string, source: TFile, editor: Editor): Promise<void> {
    const prompt = GENERATE_WORD_PHONETICS_TEMPLATE.replace('{WORD}', word).replace('{CONTEXT}', getCurrentContext(editor)).replace('{LANGUAGE}', this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English');
    let result = await sendLLMRequest(prompt, this.settings.llmSettings);
    let lastLine = editor.lastLine();
    const lastLineText = editor.getLine(lastLine);

    editor.replaceSelection(`***${word}***`);
    if (lastLineText.startsWith(' - ')) {
      editor.setLine(lastLine+1, `\n - ${result}`);
    } else {
      editor.setLine(lastLine+1, `\n\n Word Bank \n - ${result}`);
    }
    const cursor = editor.getCursor();
    const currentLine = editor.getLine(cursor.line);

    let blockId = extractBlockId(currentLine);
    if (!blockId) {
      blockId = genBlockId();
      editor.setLine(cursor.line, `${currentLine} ^${blockId}\n`);
    } 

    await this.addToWordBank(result, source, blockId);
  }

  async handleSyntaxAnalysisRequest(text: string, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.thinking);
    try {
      const prompt = SYNTAX_ANALYSIS_TEMPLATE.replace('{TEXT}', text);
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      const displayText = `\n${text}\n\n ${result}`;
      editor.replaceRange(`${addQuoteToText(displayText, this.trans.syntaxAnalysis)}\n\n`, nextLinePos);
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
    statusBarItem.setText(this.trans.thinking);
    try {
      const prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{GRADE}', this.settings.stuSettings.grade).replace('{TOPIC}', topic).replace('{LANGUAGE}', this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English');
      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      editor.replaceRange(`${addQuoteToText(result, this.settings.stuSettings.localLanguage === 'zh-Hans'?'扩展题目':'Similar topics')}\n\n`, nextLinePos);
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
      const prompt = GENERATE_LEARNING_POINTS_TEMPLATE.replace('{TOPIC}', topic).replace('{LANGUAGE}', this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English');

      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      editor.replaceRange(`${addQuoteToText(result, this.settings.stuSettings.localLanguage === 'zh-Hans'?'知识点':'Knowledge points')}\n\n`, nextLinePos);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handleAnswerQuestionRequest(question: string, editor: Editor): Promise<void> {
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.thinking);
    try {
      const prompt = GEN_QUESTION_ANSWER_TEMPLATE.replace('{QUESTION}', question).replace('{GRADE}', this.settings.stuSettings.grade).replace('{LANGUAGE}', this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English');

      const result = await sendLLMRequest(prompt, this.settings.llmSettings);
      const endOffset = editor.getCursor('to');
      const nextLinePos = {line: endOffset.line + 1, ch: 0};
      editor.replaceRange(`${addQuoteToText(result, this.settings.stuSettings.localLanguage === 'zh-Hans'?'解答':'Answer')}\n\n`, nextLinePos);
      statusBarItem.setText("");
    } catch (error) {
      console.error(error);
      statusBarItem.setText(this.trans.errorHappen + error.message);
      setTimeout(() => {
          statusBarItem.setText("");
      }, 5000);
    }
  }

  async handlePaintingAnalysisRequest(imageFile: string, editor: Editor): Promise<void> {
    //console.debug(`Image file: ${imageFile}`);
    const file = await this.getLinkedFile(imageFile);
    if (!file) {
      new Notice(`Image file not exist: ${imageFile}`);
      return;
    }
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText(this.trans.thinking);
    try {
      const imageBuffer: ArrayBuffer = await this.app.vault.adapter.readBinary(file.path);
      const result = await genPaintingAnalysis(imageBuffer, file.extension, this.settings.llmSettings, this.settings.stuSettings.localLanguage === 'zh-Hans'?'中文':'English');
      const endOffset = editor.getCursor('from');
      const linePos = {line: endOffset.line, ch: 0};
      editor.replaceRange(`${result}\n`, linePos);
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
        const pluginInstallPath = normalizePath(`${this.app.vault.configDir}/${plugin}`);
        if (!await this.app.vault.adapter.exists(pluginInstallPath)) {
          await this.app.vault.adapter.mkdir(pluginInstallPath);
        }
        const pluginFiles = await this.app.vault.adapter.list(plugin);
        for (let j = 0; j< pluginFiles.files.length; j++) {
          const pluginFile = pluginFiles.files[j];
          let fileName = this.app.vault.getAbstractFileByPath(pluginFile)?.name;
          let dstFilePath = normalizePath(`${pluginInstallPath}/${fileName}`);
          if (await this.app.vault.adapter.exists(dstFilePath)) {
            await this.app.vault.adapter.remove(dstFilePath);
          }
          await this.app.vault.adapter.copy(`${pluginFile}`, dstFilePath);
        }
        //console.debug(`${plugin} install to ${pluginInstallPath}`);
      }
      new Notice('Plugin updated');
    }
  }

  registerEditorMenu(): void {
    if (!Platform.isDesktop) {
      return;
    }
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();

        const imageRegex = /!?\[?\[?(.*\.(jpg|jpeg|png))\]?\]?/;
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
                this.handleAddToWordBankRequest(selection, view.file, editor);
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
          // 解答题目
          menu.addItem(item => {
            item
              .setTitle(this.trans.answerQuestionMenu)
              .setIcon('document')
              .onClick(async() => {
                this.handleAnswerQuestionRequest(selection, editor);
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
        this.handleTranslateTextRequest(selection, editor);
      }
    });
    this.addCommand({
      id: 'word_bank',
      name: this.trans.addWordBank,
      icon: "pen-line",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        this.handleAddToWordBankRequest(selection, view.file, editor);
      }
    });
    this.addCommand({
      id: 'syntax_analysis',
      name: this.trans.syntaxAnalysis,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        this.handleSyntaxAnalysisRequest(selection, editor);
      }
    });

    this.addCommand({
      id: 'text_to_speech',
      name: this.trans.textToSpeech,
      icon: "audio-lines",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        this.handleTextToSpeechRequest(selection, view.file, editor);
      }
    });

    this.addCommand({
      id: 'gen_learning_point',
      name: this.trans.analysisAndSummarize,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
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
      id: 'painting_analysis',
      name: this.trans.paintingAnalysis,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        const imageRegex = /!?\[?\[?(.*\.(jpg|jpeg|png|bmp))\]?\]?/;
        
        const match = selection.match(imageRegex);
        if (match) {
          let imageFile = match[1]
          this.handlePaintingAnalysisRequest(imageFile, editor);
        } 
      }
    });

    this.addCommand({
      id: 'answer_question',
      name: this.trans.answerQuestion,
      icon: "brain",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        this.handleAnswerQuestionRequest(selection, editor);
      }
    });

    this.addCommand({
      id: 'plugin_update',
      name: "Plugin update",
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
    //console.debug(`audio_path: ${audio_path}`)
    if (!await this.app.vault.adapter.exists(audio_path)) {
      await this.app.vault.adapter.mkdir(audio_path)
    }
    // Get output mp3 file path
    let audio_full_path = this.app.vault.adapter.getFullPath(audio_path)
    //console.debug(`audio_full_path: ${audio_full_path}`)
    let full_path = '';
    let rel_path = '';
    let i = 0;
    do {
      let output_fname = ''
      output_fname = `${tfile.basename}_${i}.mp3`;
      full_path = normalizePath(`${audio_full_path}/${output_fname}`);
      rel_path = normalizePath(`${audio_path}/${output_fname}`);
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

function isFileImage(path: string): boolean {
  return (
    path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
    path.endsWith('.webp') || path.endsWith('.gif') || path.endsWith('.bmp')
  )
}

function isImageFiles(files: TFile[]): boolean {
  for (const file of files) {
    let f_path = file.path
    if (!isFileImage(f_path)) {
      return false
    }
  }
  return true
}

async function createNote(name: string, contents = '', openInNewTab = true): Promise<TFile | null> {
  //console.debug(`Create note: ${name}`);
  try {
    let pathPrefix: string = this.app.fileManager.getNewFileParent('').path
  
    let path = `${pathPrefix}${name}`
    // Check if file already exists
    if (this.app.vault.getAbstractFileByPath(`${path}.md`)) {
      // Append a number to the end of the file name
      let i = 1
      while (await this.app.vault.getAbstractFileByPath(`${path} ${i}.md`)) {
        i++
      }
      path += ` ${i}`
    }

    // Create and open the file
    const file = await this.app.vault.create(`${path}.md`, contents)
    if (openInNewTab) {
      this.app.workspace.openLinkText(path, '');
    }
    return file;
  } catch (e) {
    new Notice('Text Extract - Could not create note: ' + (e as any).message)
    throw e
  }
}

async function createImagesNote(files: TAbstractFile[]): Promise<void> {
  const filePaths: string[] = files.map(file => file.path);
  filePaths.sort();

  let contents: string = filePaths.map(path => `![[${path}]]`).join('\n');

  // Create a new note and open it
  await createNote("Untitled", contents);
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
  // 去除文件链接标记
  text = text.replace(/!\[\[.*\]\]/g, '');
  // 去除块引用标记
  text = text.replace(/\^\w{5,6}$/gm, '');
  return text;
}

function getCurrentDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractBlockId(text: string): string | undefined {
  const blockIdRegex = /\^(\w{5,6})$/;
  const match = text.match(blockIdRegex);
  if (match) {
    return match[1];
  } else {
    return undefined;
  }
}

function genBlockId(): string {
  // 生成 6 位随机字母数字字符串
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let blockId = '';
  for (let i = 0; i < 6; i++) {
    blockId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return blockId;
}

function getCurrentContext(editor: Editor): string {

  function getEndingPos(lineText: string, cursorPos: number, direction: 'left' | 'right'): number {
      const sentenceEndings = ['.', '!', '?', '。', '！', '？'];
      
      if (direction === 'left') {
        let start = 0;
        for (let i = cursorPos - 1; i >= 0; i--) {
            if (sentenceEndings.includes(lineText[i])) {
                start = i + 1;
                break;
            }
        }
        return start;
      } else {
        let end = lineText.length;
        for (let i = cursorPos; i < lineText.length; i++) {
            if (sentenceEndings.includes(lineText[i])) {
                end = i + 1;
                break;
            }
        }
        return end;
      }
  }
  const from = editor.getCursor('from');
  const to = editor.getCursor('to');

  if (from.line !== to.line) {
    return '';
  } 
  const cursor = editor.getCursor();
  const lineText = editor.getLine(cursor.line);
  if (!lineText) return '';

  const start = getEndingPos(lineText, from.ch, 'left');
  const end = getEndingPos(lineText, to.ch, 'right');
  return lineText.slice(start, end).trim();
}