<div class="app">
  <History/>
  {#if window.templates == 'planets'}
    <Alien state={$alienState}/>
  {/if}
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
  <Hints/>
  <Skills/>
  <Buttons error={$error} {handleUndo}/>
</div>

<script>
  // import { onMount, afterUpdate } from 'svelte'
  // import { SVG } from '@svgdotjs/svg.js'
  import History from '$components/History.svelte'
  import Alien from '$components/Alien.svelte'
  import DraggableOperators from '$components/DraggableOperators.svelte'
  import Equation from '$components/Equation.svelte'
  import Hints from '$components/Hints.svelte'
  import Skills from '$components/Skills.svelte'
  import Buttons from '$components/Buttons.svelte'
  import { history } from '$stores/history.js'
  import { draftEquation, dragdropData } from '$stores/equation.js'
  import { lastCorrect, error, alienState } from '$stores/messageManager.js'
  import { parseGrammar } from '$utils/grammarParser.js'

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
      'steps operators skills'
      'steps main skills'
      'steps hints buttons';
    grid-template-columns: minmax(230px, 3fr) 9fr minmax(200px, 2fr);
    grid-template-rows: 200px 1fr minmax(200px, 25%);
    row-gap: 50px;
    background: center / cover no-repeat #10213a;
  }
  :global(#planets) .app {
    grid-template-areas:
      'steps operators skills'
      'steps main skills'
      'alien hints buttons';
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
  @keyframes dash {
    to {
      stroke-dashoffset: -20;
    }
  }
</style>
