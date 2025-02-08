import KnowledgeBaseHelperPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface OcrSettings {
  appID: string;
  apiKey: string;
  apiSecret: string;
}

export interface KnowledgeBaseHelperSettings {
  ttsLanguage: string;
  ttsOutputPath: string;
  ocrSettings: OcrSettings;
}

export const DEFAULT_SETTINGS: KnowledgeBaseHelperSettings = {
  ttsLanguage: 'en',
  audioPath: '_audios',
  ocrSettings: {
    appID: '',
    apiKey: '',
    apiSecret: ''
  }
}

export class KnowledgeBaseHelperSettingTab extends PluginSettingTab {
  plugin: KnowledgeBaseHelperPlugin;

  constructor(app: App, plugin: KnowledgeBaseHelperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let {containerEl} = this;
    containerEl.empty();

    containerEl.createEl('h1', {text: '知识库助手'});

    containerEl.createEl('h2', {text: '音频生成'});

    new Setting(containerEl)
      .setName('音频语言')
      .setDesc('生成音频的语言')
      .addDropdown((dropdown) => {
        dropdown.addOption('en', '英语');
        dropdown.addOption('zh-cn', '普通话');
        dropdown.setValue(this.plugin.settings.ttsLanguage);
        dropdown.onChange((option) => {
            this.plugin.settings.ttsLanguage = option;
            this.plugin.saveSettings();
        });
    });
    new Setting(containerEl)
      .setName('音频保存目录')
      .setDesc('音频存放位置')
      .addText(text => text
        .setPlaceholder('_audio')
        .setValue(this.plugin.settings.ttsOutputPath)
        .onChange(async (value) => {
          this.plugin.settings.ttsOutputPath = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', {text: '文字识别'});
    new Setting(containerEl)
      .setName('APP ID')
      .setDesc('百度文字识别 APP ID')
      .addText(text => text
        .setPlaceholder('你申请到的APP ID')
        .setValue(this.plugin.settings.ocrSettings.appID)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.appID = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('百度文字识别 API Key')
      .addText(text => text
        .setPlaceholder('你申请到的API Key')
        .setValue(this.plugin.settings.ocrSettings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API Secret')
      .setDesc('百度文字识别 API Secret')
      .addText(text => text
        .setPlaceholder('你申请到的API Secret')
        .setValue(this.plugin.settings.ocrSettings.apiSecret)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.apiSecret = value;
          await this.plugin.saveSettings();
        }));
  }

}