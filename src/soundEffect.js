import spriteMap from "./assets/audio/dragDropAudioSprite.json";
import { Howl } from "howler";

const soundEffects = new Howl({
  ...spriteMap,
  src: ["./Assets/audio/dragDropAudioSprite.mp3"],
});

soundEffects.volume(0.25);

export default soundEffects;
