import spriteMap from "$assets/audio/dragDropAudioSprite.json"
import spriteMP3 from "$assets/audio/dragDropAudioSprite.mp3"
import { Howl } from "howler"

export const soundEffects = new Howl({
  ...spriteMap,
  src: [spriteMP3],
})

soundEffects.volume(0.25)
