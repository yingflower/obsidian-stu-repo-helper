export async function textToSpeech(text: string, output_fpath: string, settings: StudentRepoSettings): Promise<void> {
  const gTTS = require('node-gtts')

  // Generate TTS audio
  var gtts = new gTTS(settings.ttsLanguage, true)
  await gtts.save(output_fpath, text, (err, result) => {
    if (err) {
      throw new Error(err)
    }
    //console.debug(`Audio saved to ${output_fpath}`)
  })

}