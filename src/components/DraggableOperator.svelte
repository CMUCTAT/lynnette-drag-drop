<script>
  import DragDrop from './DragDrop.svelte';
  import { Operators } from '../classes.js';
  import { draftEquation, dragdropData } from '../stores/equation.js';

  export let operator;
  export let onlySymbol = false;
  let isDivide = !onlySymbol && operator === 'DIVIDE';

  function handleDropSend(e) {
    draftEquation.apply();
  }

  function handleDragStart(e) {
    dragdropData.setDrag(operator);
  }
</script>

<style>
  /* .divide {
      padding: 0;
      margin: 4px;
      width: 100%;
      height: 2px;
      background: #333;
      border-radius: 2px;
    } */
  .draggable-operator {
    margin: 10px;
  }
  .operator {
    color: #fff;
    padding: 10px;
    text-align: center;
    border-radius: 5px;
    box-sizing: border-box;
    min-width: 58px;
    height: 58px;
    line-height: 37px;
    font-size: 35px;
    pointer-events: none;
    transition: all 0.25s ease;
  }
  .dropzone.operator {
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: #fff0;
    background: none;
    color: #fff0;
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

<div class="draggable-operator">
  <DragDrop
    let:dragging
    let:hovering
    let:draghovering
    let:fade
    canDragHover={false}
    dragStart={handleDragStart}
    dropSend={handleDropSend}>
    <div
      slot="dropzone"
      class="operator no-highlight dropzone"
      class:dragging
      class:hovering
      class:draghovering>
      <div class="no-highlight" class:divide={isDivide}>
        {#if !isDivide}{Operators[operator]}{/if}
      </div>
    </div>
    <div
      slot="mover"
      class="operator no-highlight mover"
      class:dragging
      class:hovering
      class:draghovering
      class:fade>
      <div class="no-highlight" class:divide={isDivide}>
        {#if !isDivide}{Operators[operator]}{/if}
      </div>
    </div>
  </DragDrop>
</div>
