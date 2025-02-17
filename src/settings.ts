import StudentRepoPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface StudentSettings {
  grade: string;
}

export interface OcrSettings {
  appID: string;
  apiKey: string;
  apiSecret: string;
}

export interface LLMSettings {
  apiBase: string;
  apiKey: string;
  modelName: string;
}

export interface AzureSettings {
  speechSubscriptionKey: string;
  mtSubscriptionKey: string;
}

export interface SpeechSettings {
  speechLanguage: string,
  speechOutputPath: string,
  speechVoice: string
}
export interface StudentRepoSettings {
  stuSettings: StudentSettings;
  speechSettings: SpeechSettings;
  ocrSettings: OcrSettings;
  llmSettings: LLMSettings;
  azureSettings: AzureSettings;
}



export const DEFAULT_SETTINGS: StudentRepoSettings = {
  stuSettings: {
    grade: '小学四年级'
  },
  speechSettings: {
    speechLanguage: 'en',
    speechVoice: 'en-GB-SoniaNeural',
    speechOutputPath: '_audios',
  },
  ocrSettings: {
    appID: '',
    apiKey: '',
    apiSecret: ''
  },
  llmSettings: {
    apiBase: '',
    apiKey: '',
    modelName: ''
  },
  azureSettings: {
    speechSubscriptionKey: '',
    mtSubscriptionKey: ''
  }
}

export class StudentRepoSettingTab extends PluginSettingTab {
  plugin: StudentRepoPlugin;

  constructor(app: App, plugin: StudentRepoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let {containerEl} = this;
    containerEl.empty();

    containerEl.createEl('h1', {text: '学生知识库助手'});
    new Setting(containerEl)
      .setName('学生就读年级')
      .setDesc('学生就读年级')
      .addText(text => text
        .setPlaceholder('小学四年级')
        .setValue(this.plugin.settings.stuSettings.grade)
        .onChange(async (value) => {
          this.plugin.settings.stuSettings.grade = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', {text: '大语言模型'});
    
    new Setting(containerEl)
      .setName('API Base')
      .setDesc('大模型 API URL')
      .addText(text => text
        .setPlaceholder('你申请到的API URL')
        .setValue(this.plugin.settings.llmSettings.apiBase)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.apiBase = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('大模型 API Key')
      .addText(text => text
        .setPlaceholder('你申请到的API Key')
        .setValue(this.plugin.settings.llmSettings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('Model Name')
      .setDesc('大模型 Model Name')
      .addText(text => text
        .setPlaceholder('你申请到的Model Name')
        .setValue(this.plugin.settings.llmSettings.modelName)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.modelName = value;
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
    /**
    containerEl.createEl('h2', {text: '音频合成'});
    new Setting(containerEl)
      .setName('音频语言')
      .setDesc('生成音频的语言')
      .addDropdown((dropdown) => {
        dropdown.addOption('en', '英语');
        dropdown.addOption('zh-cn', '普通话');
        dropdown.setValue(this.plugin.settings.speechLanguage);
        dropdown.onChange((option) => {
            this.plugin.settings.speechLanguage = option;
            this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName('音频保存目录')
      .setDesc('音频存放位置')
      .addText(text => text
        .setPlaceholder('_audio')
        .setValue(this.plugin.settings.speechOutputPath)
        .onChange(async (value) => {
          this.plugin.settings.speechOutputPath = value;
          await this.plugin.saveSettings();
        }));
    */
    containerEl.createEl('h2', {text: '语音合成与翻译'});
    new Setting(containerEl)
      .setName('语音服务Key')
      .setDesc('Microsoft Azure Speech Subscription Key')
      .addText(text => text
        .setPlaceholder('Your Azure Speech Subscription Key')
        .setValue(this.plugin.settings.azureSettings.speechSubscriptionKey)
        .onChange(async (value) => {
          this.plugin.settings.azureSettings.speechSubscriptionKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('语音风格')
      .setDesc('生成语音的风格')
      .addDropdown((dropdown) => {
        dropdown.addOption('en-GB-SoniaNeural', '英式');
        dropdown.addOption('en-US-AmandaMultilingualNeural', '美式');
        dropdown.setValue(this.plugin.settings.speechSettings.speechVoice);
        dropdown.onChange((option) => {
            this.plugin.settings.speechSettings.speechVoice = option;
            this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
    .setName('翻译服务Key')
    .setDesc('Microsoft Azure Translator Subscription Key')
    .addText(text => text
      .setPlaceholder('Your Azure Translator Subscription Key')
      .setValue(this.plugin.settings.azureSettings.mtSubscriptionKey)
      .onChange(async (value) => {
        this.plugin.settings.azureSettings.mtSubscriptionKey = value;
        await this.plugin.saveSettings();
      }));
    };
}