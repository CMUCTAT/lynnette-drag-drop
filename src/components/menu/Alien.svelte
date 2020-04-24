<script>
  import { onMount, beforeUpdate } from "svelte";
  // import soundEffects from "../../soundEffect.js";
  export let state;
  import bodyNeutral from "../../assets/images/body/neutral.png";
  import bodyPoint from "../../assets/images/body/point.png";
  import bodyExcited from "../../assets/images/body/excited.png";
  import bodyConfused from "../../assets/images/body/confused.png";

  import faceNeutral from "../../assets/images/face/neutral.png";
  import faceProblem from "../../assets/images/face/problem.png";
  import faceExcited from "../../assets/images/face/excited.png";
  import faceConfused from "../../assets/images/face/confused.png";

  let prevState;
  const stateMap = {
    default: {
      body: bodyNeutral,
      face: faceNeutral
    },
    error: {
      body: bodyPoint,
      face: faceProblem
    },
    hint: {
      body: bodyPoint,
      face: faceExcited
    },
    success: {
      body: bodyExcited,
      face: faceExcited
    }
  };
  $: body = stateMap[state] ? stateMap[state].body : stateMap.default.body;
  $: face = stateMap[state] ? stateMap[state].face : stateMap.default.face;

  // const effectsMap = {
  //   error: { play: () => soundEffects.play("hmm") },
  //   // hint: { play: () => soundEffects.play("hmm") },
  //   success: { play: () => soundEffects.play("haHa") }
  // };

  // beforeUpdate(() => {
  //   if (state !== prevState) {
  //     let sound = effectsMap[state];
  //     if (sound) sound.play();
  //   }
  //   prevState = state;
  // });
</script>

<style>
  .Alien {
    pointer-events: none;
    width: 350px;
    position: absolute;
    top: 20px;
    left: 0;
  }
  .circle {
    content: "";
    width: 150%;
    height: 150%;
    background: #ccc;
    border-radius: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .alien-face {
    position: absolute;
    top: 0;
    left: 0;
  }
  .display {
    width: calc(100% - 60px);
    padding: 30px;
  }
</style>

<div class="Alien">
  <img class="display alien-body" src={body} alt="" />
  <img class="display alien-face" src={face} alt="" />
</div>
