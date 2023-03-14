<div class="app">
  <History/>
  <Alien state={$alienState}/>
  <div id="hint-window" class="CTATHintWindow"
       class:visible={$showMessages} class:translucent={$dragdropData.drag}>
    <span class="error-hint" class:visible={$showMessages && $error}>! Press the Undo Button !</span>
  </div>
  <DraggableOperators/>
  <div class="main">
    <!-- <div id="drawing"/> -->
    {#if $history.current}
      {#if $dragdropData.drop}
        <Equation draft={true} equation={parsedDraft}/>
      {/if}
      <Equation error={$error} equation={parsedEqn}/>
    {/if}
  </div>
  <Buttons error={$error} {handleUndo}/>
</div>

<script>
  import History from '$components/History.svelte'
  import Alien from '$components/Alien.svelte'
  import DraggableOperators from '$components/DraggableOperators.svelte'
  import Equation from '$components/Equation.svelte'
  import Buttons from '$components/Buttons.svelte'
  // import { onMount, afterUpdate } from 'svelte'
  // import { SVG } from '@svgdotjs/svg.js'
  import { parseGrammar } from '$utils/grammarParser.js'
  import { history } from '$stores/history.js'
  import { draftEquation, dragdropData } from '$stores/equation.js'
  import { showMessages, lastCorrect, error, alienState } from '$stores/messageManager.js'

  // let draw
  // onMount(() => {
  //   draw = SVG().addTo('#drawing').size('100%', '100%')
  // })

  function handleUndo() {
    history.undo()
    if ($lastCorrect === $history.current) {
      alienState.set(null)
      error.set(null)
    }
  }

  $: parsedEqn = parseGrammar($history.current)
  let parsedDraft = parseGrammar($draftEquation)
  $: if ($draftEquation) {
    try {
      parsedDraft = parseGrammar($draftEquation)
    } catch (exception) {
      console.error(exception)
    }
  }

  // afterUpdate(() => {
  //   if (parsedEqn) {
  //     console.log('equation', parsedEqn)
  //     // const subEqn = parsedEqn.left.items.find(item => item.items) || parsedEqn.left,
  //     const start = document.getElementById(parsedEqn.left.items[1].items[0].id),
  //           end = document.getElementById(parsedEqn.left.items[1].items[1].id),
  //           startRect = start.getBoundingClientRect(),
  //           endRect = end.getBoundingClientRect(),
  //           startPos = {
  //             x: (startRect.left + startRect.right) / 2,
  //             y: (startRect.top + startRect.bottom) / 2
  //           },
  //           endPos = {
  //             x: (endRect.left + endRect.right) / 2,
  //             y: (endRect.top + endRect.bottom) / 2
  //           }
  //     draw.clear()
  //     const path = draw.path(`M ${startPos.x}, ${startPos.y - 20}
  //                             C ${startPos.x + 30}, ${startPos.y - 90}
  //                               ${endPos.x - 30}, ${endPos.y - 90}
  //                               ${endPos.x}, ${endPos.y - 20}`)
  //     path.stroke({ color: 'var(--drag-highlight-color)', width: 5 }).fill('none')
  //     path.marker('end', 4, 4, function(add) {
  //       add.polygon('3,2 0,0 0,4')
  //       this.fill('var(--drag-highlight-color)')
  //     })
  //   }
  // })
</script>

<style>
  .app {
    height: 100%;
    display: grid;
    grid-template-areas:
      'steps operators buttons'
      'steps main buttons'
      'alien hints buttons';
    grid-template-columns: minmax(255px, 2fr) 6fr minmax(165px, 1fr);
    grid-template-rows: 200px 1fr minmax(200px, 25%);
    row-gap: 50px;
    background: center / cover no-repeat url('$assets/images/lynnette-sapce-bg.png');
  }
  .main {
    grid-area: main;
    justify-self: center;
    position: relative;
    padding-top: 96px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  #hint-window {
    grid-area: hints;
    justify-self: center;
    align-self: center;
    z-index: 1000;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 10px 10px;
    border-radius: 10px;
    min-width: 300px;
    max-width: 600px;
    width: 50vw;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    opacity: 0;
    transition: all 0.25s ease;
    font-size: 16px;
    background: #f5f4f3;
  }
  #hint-window.visible {
    bottom: 33%;
    opacity: 1;
  }
  #hint-window.visible.translucent {
    opacity: 0.2;
    pointer-events: none;
  }
  :global(.CTATHintWindow--hint-content) {
    flex: 1;
    overflow: auto;
  }
  :global(.CTATHintWindow--hint-button-area) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  :global(.CTATHintWindow--button) {
    margin: 0px;
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
  :global(.CTATHintWindow--previous), :global(.CTATHintWindow--next) {
    padding-inline: 0px;
  }
  :global(.CTATHintWindow--previous)::before, :global(.CTATHintWindow--next)::after {
    padding-inline: 5px;
    font: 20px monospace;
  }
  :global(.CTATHintWindow--previous)::before {
    content: '◀';
  }
  :global(.CTATHintWindow--next)::after {
    content: '▶';
  }
  :global(.titel) {
    display: none;
  }
  :global(.ctatpageoverlay) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 30px 50px 30px;
    background: #f5f4f3;
  }
  :root {
    /* --drag-highlight-color: #26ffd0; */
    --drag-highlight-color: #7b57ff;
  }
  @media only screen and (max-width: 820px) {
    .app {
      grid-template-areas:
        'steps operators buttons'
        'steps main buttons'
        'steps hints buttons';
      grid-template-columns: 130px 6fr 1fr;
      grid-template-rows: 150px auto 20%;
      gap: 0;
    }
  }
  /* #drawing {
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
  } */
  .error-hint {
    margin-right: auto;
    margin-bottom: 5px;
    border-radius: 3px;
    padding: 5px 10px;
    display: none;
    color: #750c18;
    background: #f1384d;
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
