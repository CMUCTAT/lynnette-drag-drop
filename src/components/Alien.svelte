<script>
  export let state;
  import bodyNeutral from '$assets/images/body/neutral.png';
  import bodyPoint from '$assets/images/body/point.png';
  import bodyExcited from '$assets/images/body/excited.png';
  // import bodyConfused from '$assets/images/body/confused.png';

  import faceNeutral from '$assets/images/face/neutral.png';
  import faceProblem from '$assets/images/face/problem.png';
  import faceExcited from '$assets/images/face/excited.png';
  // import faceConfused from '$assets/images/face/confused.png';

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
    height: 100%;
    width: 100%;
  }
  .alien-face {
    position: absolute;
    top: 0;
    left: 0;
  }
  .image-container {
    position: absolute;
    width: 80%;
    height: 80%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  @media only screen and (max-width: 820px) {
    .Alien {
      display: none;
    }
  }
</style>

<div class="Alien">
  <div class="image-container">
    <img class="display alien-body" src={body} alt="" />
    <img class="display alien-face" src={face} alt="" />
  </div>
</div>
