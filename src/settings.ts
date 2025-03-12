import StudentRepoPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface StudentSettings {
  grade: string;
  localLanguage: string;
  wordBankFile: string;
}

export interface AccessToken {
  token: string
	exp: number
}
export interface OcrSettings {
  appID: string;
  apiKey: string;
  apiSecret: string;
  accessToken: AccessToken;
}

export interface LLMSettings {
  apiBase: string;
  apiKey: string;
  modelName: string;
}

export interface TranslationSettings {
  subscriptionKey: string;
}

export interface SpeechSettings {
  subscriptionKey: string;
  speechVoice: string
  speechLanguage: string,
  speechOutputPath: string,
}
export interface StudentRepoSettings {
  stuSettings: StudentSettings;
  speechSettings: SpeechSettings;
  ocrSettings: OcrSettings;
  llmSettings: LLMSettings;
  mtSettings: TranslationSettings;
}



export const DEFAULT_SETTINGS: StudentRepoSettings = {
  stuSettings: {
    grade: '小学四年级',
    localLanguage: 'zh-Hans',
    wordBankFile: ''
  },
  speechSettings: {
    subscriptionKey: '',
    speechLanguage: 'en',
    speechVoice: 'en-GB-SoniaNeural',
    speechOutputPath: '_audios',
  },
  ocrSettings: {
    appID: '',
    apiKey: '',
    apiSecret: '',
    accessToken: {
      token: '',
      exp: 0
    },
  },
  llmSettings: {
    apiBase: '',
    apiKey: '',
    modelName: ''
  },
  mtSettings: {
    subscriptionKey: ''
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

    new Setting(containerEl).setName(this.plugin.trans.pluginName).setHeading();
    new Setting(containerEl)
      .setName(this.plugin.trans.studentGrade)
      .setDesc(this.plugin.trans.studentGrade)
      .addText(text => text
        .setPlaceholder(this.plugin.trans.studentGradePlaceholder)
        .setValue(this.plugin.settings.stuSettings.grade)
        .onChange(async (value) => {
          this.plugin.settings.stuSettings.grade = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
    .setName(this.plugin.trans.localLanguage)
    .setDesc(this.plugin.trans.localLanguage)
    .addDropdown((dropdown) => {
      dropdown.addOption('en', 'English');
      dropdown.addOption('zh-Hans', '普通话');
      dropdown.setValue(this.plugin.settings.stuSettings.localLanguage);
      dropdown.onChange((option) => {
          this.plugin.settings.stuSettings.localLanguage = option;
          this.plugin.saveSettings();
      });
    });

    new Setting(containerEl).setName(this.plugin.trans.llmSetting).setHeading();
    new Setting(containerEl)
      .setName('API base URL')
      .setDesc(`LLM API base URL`)
      .addText(text => text
        .setPlaceholder('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
        .setValue(this.plugin.settings.llmSettings.apiBase)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.apiBase = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API key')
      .setDesc(`LLM API key`)
      .addText(text => text
        .setPlaceholder('sk-***')
        .setValue(this.plugin.settings.llmSettings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('Model name')
      .setDesc(`LLM model name`)
      .addText(text => text
        .setPlaceholder('qwen-turbo')
        .setValue(this.plugin.settings.llmSettings.modelName)
        .onChange(async (value) => {
          this.plugin.settings.llmSettings.modelName = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl).setName(this.plugin.trans.ocrSetting).setHeading();
    new Setting(containerEl)
      .setName('APP ID')
      .setDesc(`${this.plugin.trans.ocrProvider} APP ID`)
      .addText(text => text
        .setPlaceholder(this.plugin.trans.ocrAppIDPlaceholder)
        .setValue(this.plugin.settings.ocrSettings.appID)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.appID = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API key')
      .setDesc(`${this.plugin.trans.ocrProvider} API key`)
      .addText(text => text
        .setPlaceholder(this.plugin.trans.ocrAPIKeyPlaceholder)
        .setValue(this.plugin.settings.ocrSettings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('API secret')
      .setDesc(`${this.plugin.trans.ocrProvider} API secret`)
      .addText(text => text
        .setPlaceholder(this.plugin.trans.ocrAPISecretPlaceholder)
        .setValue(this.plugin.settings.ocrSettings.apiSecret)
        .onChange(async (value) => {
          this.plugin.settings.ocrSettings.apiSecret = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl).setName(this.plugin.trans.speechSetting).setHeading();
    new Setting(containerEl)
      .setName(this.plugin.trans.speechSubscriptionKey)
      .setDesc('Microsoft Azure speech subscription key')
      .addText(text => text
        .setPlaceholder(this.plugin.trans.speechSubscriptionKeyPlaceholder)
        .setValue(this.plugin.settings.speechSettings.subscriptionKey)
        .onChange(async (value) => {
          this.plugin.settings.speechSettings.subscriptionKey = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName(this.plugin.trans.speechVoiceType)
      .setDesc('Speech voice type')
      .addDropdown((dropdown) => {
        dropdown.addOption('en-GB-SoniaNeural', this.plugin.trans.speechVoiceGB);
        dropdown.addOption('en-US-AmandaMultilingualNeural', this.plugin.trans.speechVoiceUS);
        dropdown.addOption('zh-CN-XiaoxiaoNeural', this.plugin.trans.speechVoiceCN);
        dropdown.setValue(this.plugin.settings.speechSettings.speechVoice);
        dropdown.onChange((option) => {
            this.plugin.settings.speechSettings.speechVoice = option;
            this.plugin.saveSettings();
        });
      });
  };
}