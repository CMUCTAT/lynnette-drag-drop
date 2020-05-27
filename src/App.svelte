<script>
  import { afterUpdate } from 'svelte';
  import { parseGrammar } from './grammarParser.js';
  import { draftEquation, dragdropData } from './stores/equation.js';
  import { history } from './stores/history.js';
  import soundEffects from './soundEffect.js';
  import Equation from './components/Equation.svelte';
  import DraggableOperator from './components/DraggableOperator.svelte';
  import History from './components/History.svelte';

  // menu elements
  import Buttons from './components/menu/Buttons.svelte';
  import Alien from './components/menu/Alien.svelte';

  let muted = document.cookie.split('muted=')[1] === 'true';
  soundEffects.mute(muted);

  import { showMessages, lastCorrect, error, alienState } from './stores/messageManager.js';

  function onUndo() {
    history.undo();
    if ($lastCorrect === $history.current) {
      alienState.set(null);
      error.set(null);
    }
  }

  let historyScroll;

  afterUpdate(() => {
    historyScroll.scrollTop = historyScroll.scrollHeight;
    if ($history.current)
      console.log($history.current, parseGrammar($history.current))
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
    grid-template-columns: minmax(200px, 1fr) 3fr 1fr;
    grid-template-rows: 200px 1fr minmax(200px, 25%);
    row-gap: 50px;
    background: center / cover no-repeat url('./images/lynnette-sapce-bg.png');
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
    pointer-events: none;
  }
  .draft-equation {
    position: absolute;
    bottom: 0;
    transform: translateY(100%);
    opacity: 0.5;
    pointer-events: none;
  }
  #hintwindow {
    position: absolute;
    left: calc(100% - 60px);
    /* left: 100%; */
    box-shadow: rgba(0, 0, 0, 0.05) 0 0 10px 10px;
    top: 80px;
    background: #f5f4f3;
    border-radius: 10px;
    padding: 20px;
    width: 100%;
    height: 50%;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: all 0.25s ease;
  }
  #hintwindow.visible {
    opacity: 1;
    top: 50px;
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
    padding: 30px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f5f4f3;
  }
  :global(.CTATHintWindow--button) {
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  :global(.CTATHintWindow--button):hover {
    transform: scale(1.1);
  }
  :global(.CTATHintWindow--button):disabled {
    opacity: 0;
    pointer-events: none;
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
      <path style="fill:#FFC33E;" d="M170.8,6H25v263h263V123.2C288,58.5,235.5,6,170.8,6z" />
      <path style="fill:#f5f4f3;" d="M152.8,0H0v269h270V117.2C270,52.5,217.5,0,152.8,0z" />
    </svg>
    <Alien state={$alienState} />
    <div id="hintwindow" class="CTATHintWindow" class:visible={$showMessages} />
  </div>
  <div class="operators">
    <DraggableOperator operator={'PLUS'} />
    <DraggableOperator operator={'MINUS'} />
    <DraggableOperator operator={'TIMES'} />
    <DraggableOperator onlySymbol operator={'DIVIDE'} />
  </div>
  <div class="main">
    {#if $history.current}
      <div class="equation" class:disable={$error && $lastCorrect !== $history.current}>
        <Equation error={$error} equation={parseGrammar($history.current)} />
        {#if $dragdropData.drop}
          <div class="draft-equation">
            <Equation equation={parseGrammar($draftEquation)} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
  <div class="buttons">
    <Buttons error={$error && $lastCorrect !== $history.current} {onUndo} />

    <button
      class="mute"
      class:muted
      on:click={() => {
        soundEffects.mute(!soundEffects._muted);
        muted = !muted;
        document.cookie = 'muted=' + muted;
      }}>
      🕨
    </button>
  </div>
</div>
