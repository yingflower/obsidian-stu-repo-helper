import MarkdownHelperPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";


export interface MarkdownHelperSettings {
  ttsLanguage: string;
  ttsOutputPath: string;
}

export const DEFAULT_SETTINGS: MarkdownHelperSettings = {
  ttsLanguage: 'en',
  ttsOutputPath: '_audios'
}

export class MarkdownHelperSettingTab extends PluginSettingTab {
  plugin: MarkdownHelperPlugin;

  constructor(app: App, plugin: MarkdownHelperPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let {containerEl} = this;
    containerEl.empty();

    containerEl.createEl('h2', {text: 'Markdown Helper Settings'});

    new Setting(containerEl)
      .setName('TTS Language')
      .setDesc('The language of the text-to-speech')
      .addDropdown((dropdown) => {
        dropdown.addOption('en', 'English');
        dropdown.addOption('zh-cn', 'Chinese (Mandarin/China)');
        dropdown.setValue(this.plugin.settings.ttsLanguage);
        dropdown.onChange((option) => {
            this.plugin.settings.ttsLanguage = option;
            this.plugin.saveSettings();
        });
    });

    new Setting(containerEl)
      .setName('TTS Output Path')
      .setDesc('The path to save the audio files')
      .addText(text => text
        .setPlaceholder('_audio')
        .setValue(this.plugin.settings.ttsOutputPath)
        .onChange(async (value) => {
          this.plugin.settings.ttsOutputPath = value;
          await this.plugin.saveSettings();
        }));
  }
}