<script>
  import { afterUpdate, onMount } from 'svelte';
  import { parseGrammar } from '$utils/grammarParser.js';
  import { draftEquation, dragdropData } from '$stores/equation.js';
  import { history } from '$stores/history.js';
  import soundEffects from '$utils/soundEffect.js';
  import Equation from '$components/Equation.svelte';
  import DraggableOperator from '$components/DraggableOperator.svelte';
  import History from '$components/History.svelte';
  import { SVG } from '@svgdotjs/svg.js';

  // menu elements
  import Buttons from '$components/Buttons.svelte';
  import Alien from '$components/Alien.svelte';

  var draw;
  onMount(() => {
    draw = SVG().addTo('#drawing').size('100%', '100%');
  });

  let muted = document.cookie.split('muted=')[1] === 'true';
  soundEffects.mute(muted);

  import { showMessages, lastCorrect, error, alienState } from '$stores/messageManager.js';

  function onUndo() {
    history.undo();
    if ($lastCorrect === $history.current) {
      alienState.set(null);
      error.set(null);
    }
  }

  let historyScroll;

  $: parsedEqn = parseGrammar($history.current);
  let parsedDraft = parseGrammar($draftEquation);
  $: if ($draftEquation) {
    try {
      parsedDraft = parseGrammar($draftEquation);
    } catch (e) {
      console.log(e);
    }
  }

  afterUpdate(() => {
    // console.log(parse.algStringify($history.current), $history.current, parsedEqn);
    historyScroll.scrollTop = historyScroll.scrollHeight;
    // if (parsedEqn) {
    //   const start = document.getElementById(parsedEqn.left.items[1].items[0].id);
    //   const end = document.getElementById(parsedEqn.left.items[1].items[1].id);
    //   const startRect = start.getBoundingClientRect();
    //   const endRect = end.getBoundingClientRect();
    //   const startPos = {
    //     x: (startRect.left + startRect.right) / 2,
    //     y: (startRect.top + startRect.bottom) / 2,
    //   };
    //   const endPos = {
    //     x: (endRect.left + endRect.right) / 2,
    //     y: (endRect.top + endRect.bottom) / 2,
    //   };
    //   draw.clear();
    //   var path = draw.path(
    //     `M ${startPos.x},${startPos.y - 20} C ${startPos.x + 30},${startPos.y - 90} ${
    //       endPos.x - 30
    //     },${endPos.y - 90} ${endPos.x},${endPos.y - 20}`,
    //   );
    //   path.stroke({ color: 'var(--drag-highlight-color)', width: 5 }).fill('none');
    //   path.marker('end', 4, 4, function (add) {
    //     add.polygon('3,2 0,0 0,4');
    //     this.fill('var(--drag-highlight-color)');
    //   });
    // }
  });
</script>

<style>
  .app {
    height: 100vh;
    width: 100%;
    display: grid;
    grid-template-areas:
      'steps operators buttons'
      'steps main buttons'
      'alien main buttons';
    grid-template-columns: minmax(265px, 1fr) 3fr 1fr;
    grid-template-rows: 200px 1fr minmax(200px, 25%);
    row-gap: 50px;
    background: center / cover no-repeat url('$assets/images/lynnette-sapce-bg.png');
  }
  .steps {
    grid-area: steps;
    max-width: 300px;
    background: #f5f4f3;
    border-bottom-right-radius: 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    box-sizing: border-box;
  }
  .history {
    flex: 1;
    overflow: auto;
    margin-bottom: 40px;
  }
  .alien {
    grid-area: alien;
    position: relative;
  }
  .alien svg {
    position: absolute;
    top: 0;
    left: 0;
    /* right: 0;
    bottom: 0; */
    height: 100%;
  }
  .main {
    grid-area: main;
    justify-self: center;
    position: relative;
    display: flex;
    align-items: center;
    padding-bottom: 20%;
  }
  .buttons {
    grid-area: buttons;
    justify-self: center;
    align-self: end;
    padding-bottom: 100px;
    align-items: center;
    display: flex;
    flex-direction: column;
  }
  .operators {
    grid-area: operators;
    margin: 50px;
    border: 2px dashed #fff;
    border-radius: 5px;
    padding: 10px;
    display: flex;
    justify-self: center;
    align-self: center;
    user-select: none;
  }
  .equation {
    position: relative;
  }
  .equation.disable {
    pointer-events: none !important;
  }
  .draft-equation {
    position: absolute;
    bottom: 0;
    transform: translateY(-100%);
    opacity: 0.5;
    pointer-events: none;
  }
  #hintwindow {
    position: absolute;
    bottom: 0px;
    left: 100%;
    /* left: 100%; */
    box-shadow: rgba(0, 0, 0, 0.1) 0 0 10px 10px;
    /* top: 80px; */
    background: #f5f4f3;
    border-radius: 10px;
    padding: 20px;
    width: 50vw;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: all 0.25s ease;
    z-index: 1000;
  }
  #hintwindow.visible {
    opacity: 1;
    bottom: 33%;
  }
  #hintwindow.visible.translucent {
    pointer-events: none;
    opacity: 0.2 !important;
  }
  #hintwindow :global(.CTATHintWindow--hint-content) {
    flex: 1;
    overflow: auto;
  }
  #hintwindow :global(.CTATHintWindow--hint-button-area) {
    text-align: right;
  }
  :global(.ctatpageoverlay) {
    position: fixed;
    padding: 20px 30px 50px 30px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f5f4f3;
  }
  :global(.CTATHintWindow--button) {
    border: none;
    cursor: pointer;
    margin: 0;
    transition: all 0.15s ease;
  }
  :global(.CTATHintWindow--button):hover {
    transform: scale(1.1);
  }
  :global(.CTATHintWindow--button):disabled {
    opacity: 0;
    pointer-events: none;
  }
  :global(.titel) {
    display: none;
  }
  :root {
    /* --drag-highlight-color: #26ffd0; */
    --drag-highlight-color: #7b57ff;
  }
  .mute {
    border: none;
    background: none;
    color: #fff;
    font-size: 30px;
    /* width: 30px;
    height: 30px; */
    padding: 0 10px;
    cursor: pointer;
    position: relative;
  }
  .mute.muted:after {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translate(-50%, 0) rotate(45deg);
    height: 80%;
    width: 3px;
    background: #f35;
  }
  @media only screen and (max-width: 820px) {
    .app {
      grid-template-areas:
        'steps operators buttons'
        'steps main buttons'
        'alien main buttons';
      height: 100%;
      grid-template-columns: 130px 3fr 1fr;
      grid-template-rows: auto auto 0;
      gap: 0;
    }
    .steps {
      padding: 0;
      border-bottom-right-radius: 10px;
    }
    .steps h1 {
      margin: 5px 0;
      font-size: 24px;
    }
    .history {
      margin-bottom: 5px;
    }
    .alien svg {
      display: none;
    }
    .operators {
      align-self: center;
      padding: 0;
      margin: 0;
    }
    .buttons {
      padding-bottom: 30px;
    }
    #hintwindow {
      width: 250%;
    }
  }
  #drawing {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    pointer-events: none;
  }
  #drawing :global(path) {
    stroke-dasharray: 10;
    animation: dash 1s linear infinite;
  }
  .error-hint {
    background: #f1384d;
    color: #750c18;
    padding: 5px 10px;
    display: none;
    margin-bottom: 5px;
    margin-right: auto;
    border-radius: 3px;
  }
  .error-hint.visible {
    display: inline;
  }
  @keyframes dash {
    to {
      stroke-dashoffset: -20;
    }
  }
</style>

<div class="app">
  <div class="steps">
    <h1>Steps</h1>
    <div bind:this={historyScroll} class="history">
      {#if true}
        <History />
      {/if}
    </div>
  </div>
  <div class="alien">
    <svg viewBox="0 0 302 269" style="enable-background:new 0 0 302 269;">
      <path style="fill:#FF6E52;" d="M184.8,0H0v269h302V117.2C302,52.5,249.5,0,184.8,0z" />
      <path style="fill:#FFC33E;" d="M170.8,0H0v269h286V117.2C286,52.5,235.5,6,170.8,0z" />
      <path style="fill:#f5f4f3;" d="M152.8,0H0v269h270V117.2C270,52.5,217.5,0,152.8,0z" />
    </svg>
    <Alien state={$alienState} />
    <div
      id="hintwindow"
      class="CTATHintWindow"
      class:visible={$showMessages}
      class:translucent={!!$dragdropData.drag}>
      <span class="error-hint" class:visible={$showMessages && $error}>
        ! Press the Undo Button !
      </span>
    </div>
  </div>
  <div class="operators">
    <DraggableOperator operator={'PLUS'} />
    <DraggableOperator operator={'MINUS'} />
    <DraggableOperator operator={'TIMES'} />
    <DraggableOperator onlySymbol operator={'DIVIDE'} />
  </div>
  <div class="main">
    <div id="drawing" />
    {#if $history.current}
      <div class="equation" class:disable={$error}>
        <Equation error={$error} equation={parsedEqn} />
        {#if $dragdropData.drop}
          <div class="draft-equation">
            <Equation equation={parsedDraft} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="buttons">
    <Buttons error={$error} {onUndo} />
    <button
      class="mute"
      class:muted
      on:click={() => {
        soundEffects.mute(!soundEffects._muted);
        muted = !muted;
        document.cookie = 'muted=' + muted;
      }}>
      🔈
    </button>
  </div>
</div>
