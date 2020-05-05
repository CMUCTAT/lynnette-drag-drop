<script>
  import { onMount, beforeUpdate } from 'svelte';
  export let state;
  import bodyNeutral from '../../assets/images/body/neutral.png';
  import bodyPoint from '../../assets/images/body/point.png';
  import bodyExcited from '../../assets/images/body/excited.png';
  import bodyConfused from '../../assets/images/body/confused.png';

  import faceNeutral from '../../assets/images/face/neutral.png';
  import faceProblem from '../../assets/images/face/problem.png';
  import faceExcited from '../../assets/images/face/excited.png';
  import faceConfused from '../../assets/images/face/confused.png';

  let prevState;
  const stateMap = {
    default: {
      body: bodyNeutral,
      face: faceNeutral,
    },
    error: {
      body: bodyPoint,
      face: faceProblem,
    },
    hint: {
      body: bodyPoint,
      face: faceExcited,
    },
    success: {
      body: bodyExcited,
      face: faceExcited,
    },
  };
  $: body = stateMap[state] ? stateMap[state].body : stateMap.default.body;
  $: face = stateMap[state] ? stateMap[state].face : stateMap.default.face;
</script>

<style>
  .Alien img {
    height: 100%;
  }
  .Alien {
    position: relative;
    height: 78%;
    padding: 15% 10% 5% 10%;
  }
  .alien-face {
    position: absolute;
    top: 0;
    left: 0;
  }
  .image-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>

<div class="Alien">
  <div class="image-container">
    <img class="display alien-body" src={body} alt="" />
    <img class="display alien-face" src={face} alt="" />
  </div>
</div>
