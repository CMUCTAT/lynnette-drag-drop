<div class="alien">
  <svg viewBox="0 0 300 270" preserveAspectRatio="none" style="enable-background:new 0 0 300 270;">
    <path style="fill:#FF6E52;" d="M200,0 H0 v270 h300 V120 C300,50, 250,0, 200,0 z"/>
    <path style="fill:#FFC33E;" d="M185,0 H0 v270 h285 V120 C285,50, 235,0, 185,0 z"/>
    <path style="fill:#f5f4f3;" d="M170,0 H0 v270 h270 V120 C270,50, 220,0, 170,0 z"/>
  </svg>
  <div class="image-container">
    <img class="display alien-body" src={body} alt=""/>
    <img class="display alien-face" src={face} alt=""/>
  </div>
</div>

<script>
  import bodyNeutral from '$assets/images/body/neutral.png'
  import bodyPoint from '$assets/images/body/point.png'
  import bodyExcited from '$assets/images/body/excited.png'
  // import bodyConfused from '$assets/images/body/confused.png'
  import faceNeutral from '$assets/images/face/neutral.png'
  import faceProblem from '$assets/images/face/problem.png'
  import faceExcited from '$assets/images/face/excited.png'
  // import faceConfused from '$assets/images/face/confused.png'

  export let state

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
  }

  $: body = stateMap[state] ? stateMap[state].body : stateMap.default.body
  $: face = stateMap[state] ? stateMap[state].face : stateMap.default.face
</script>

<style>
  .alien {
    grid-area: alien;
    position: relative;
    max-width: 300px;
    width: 100%;
    height: 100%;
  }
  .alien svg {
    width: 100%;
    height: 100%;
  }
  .image-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
  }
  .image-container img {
    height: 100%;
  }
  .alien-face {
    position: absolute;
    left: 0px;
    top: 0px;
  }
  @media only screen and (max-width: 820px) {
    .alien {
      display: none;
    }
  }
</style>
