import { App, Notice, Plugin, TAbstractFile, Platform} from 'obsidian';
import { MarkdownHelperSettings, DEFAULT_SETTINGS } from './settings';
import { MarkdownHelperSettingTab } from './settings';

export default class MarkdownHelperPlugin extends Plugin {
  settings: MarkdownHelperSettings;
	async onload() {
    this.addSettingTab(new MarkdownHelperSettingTab(this.app, this));
    await this.loadSettings();
    console.log('Markdown Helper loaded');
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
                generateAudio(files, this.settings.ttsOutputPath, this.settings.ttsLanguage)
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
              item.setTitle('Add to Note')
              .setIcon('document')
              .onClick(async() => {
                var files = [file]
                await createImagesNote(files)
              });
            })
          }

          if (isMarkdown && Platform.isDesktop) {
            // Create Audio
            menu.addItem(item => {
              item
                .setTitle('Generate Audio')
                .setIcon('document')
                .onClick(async() => {
                  var files = [file]
                  generateAudio(files, this.settings.ttsOutputPath, this.settings.ttsLanguage)
                });
            })
          }

        }
			})
		);
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

async function generateAudio(files: TAbstractFile[], apath: string, lang: string) {
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
    audio_path = PathLib.join(file.parent.path, apath)
    console.log(`audio_path: ${audio_path}`)
    await app.vault.adapter.mkdir(audio_path)
    // Get output mp3 file path
    var abs_path = app.vault.adapter.getFullPath(file.path)
    var output_path = PathLib.dirname(abs_path)
    var output_fname = PathLib.basename(abs_path, PathLib.extname(abs_path))+'.mp3'
    var output_fpath = PathLib.join(output_path, apath, output_fname)
    //console.log(output_fpath)

    // Generate TTS audio
    var gtts = new gTTS(lang, true)
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