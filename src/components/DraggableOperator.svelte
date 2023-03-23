<div class="draggable-operator">
  <DragDrop canDragHover={false} dragStart={handleDragStart} dropSend={handleDropSend}
            let:dragging let:hovering let:draghovering let:fade>
    <div slot="dropzone" class="operator no-highlight dropzone"
         class:dragging class:hovering class:draghovering>
      <div class="no-highlight" class:divide={isDivide}>
        {#if !isDivide}{Operators[operator]}{/if}
      </div>
    </div>
    <div slot="mover" class="operator no-highlight mover"
         class:dragging class:hovering class:draghovering class:fade>
      <div class="no-highlight" class:divide={isDivide}>
        {#if !isDivide}{Operators[operator]}{/if}
      </div>
    </div>
  </DragDrop>
</div>

<script>
  import DragDrop from '$components/DragDrop.svelte'
  import { draftEquation, dragdropData } from '$stores/equation.js'
  import { Operators } from '$utils/classes.js'

  export let operator
  export let onlySymbol = false

  let isDivide = !onlySymbol && operator === 'DIVIDE'

  function handleDragStart(event) {
    dragdropData.setDrag(operator)
  }

  function handleDropSend(event) {
    draftEquation.apply()
  }
</script>

<style>
  /* .divide {
      margin: 4px;
      border-radius: 2px;
      width: 100%;
      height: 2px;
      padding: 0px;
      background: #333;
    } */
  .draggable-operator {
    margin: 10px;
  }
  .operator {
    border-radius: 5px;
    box-sizing: border-box;
    min-width: 58px;
    height: 58px;
    padding: 10px;
    text-align: center;
    line-height: 37px;
    font-size: 35px;
    color: #fff;
    pointer-events: none;
    transition: all 0.25s ease;
  }
  .dropzone.operator {
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: #fff0;
    color: #fff0;
    background: none;
  }
  .dragging.dropzone {
    -webkit-text-stroke-color: #fff;
  }
  .dragging.mover {
    transform: scale(1.3);
  }
  .draghovering.mover {
    background: var(--drag-highlight-color);
    transform: scale(1.3);
  }
  .hovering.operator {
    transform: scale(1.3);
  }
  .draghovering.mover {
    background: #19ff9f;
  }
  .mover.fade {
    transform: scale(0) !important;
    opacity: 0 !important;
  }
</style>
