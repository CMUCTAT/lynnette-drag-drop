<script>
  import { draftEquation, dragdropData } from '../stores/equation.js';
  import DragDrop from './DragDrop.svelte';

  export let token;
  export let isSubtract = false;

  function handleDragStart(e) {
    dragdropData.setDrag(token);
  }

  function handleDropReceive(e) {
    draftEquation.apply();
  }

  function handleDragLeave(e) {
    dragdropData.setDrop(null);
  }

  function handleDragHover(e) {
    dragdropData.setDrop(token);
    draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop);
  }

  function handleUpdateToken(e) {
    draftEquation.updateToken(token, e.target.value);
  }
  $: value = token.value(isSubtract ? -1 : 1);
</script>

<style>
  .token {
    margin: 10px;
    position: relative;
  }
  .token-inner {
    background: #fff;
    color: #333;
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
  .dropzone.token-inner {
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: #fff0;
    background: none;
    color: #fff0;
    /* box-sizing: border-box;
		opacity: 0;
		transition: opacity 0.25s ease;
		padding: 8px; */
  }
  .dragging.dropzone {
    -webkit-text-stroke-color: #fff;
  }
  .hovering.token-inner {
    transform: scale(1.2);
  }
  .dragging.mover {
    transform: scale(1.3);
  }
  .draghovering.token-inner {
    background: var(--drag-highlight-color);
    transform: scale(1.2);
  }
  input {
    margin: 0;
    padding: 8px;
    outline: none;
    border: none;
    width: 100%;
    height: 100%;
    background: none;
    text-align: center;
    color: #fff;
  }
  .token.unknown .token-inner {
    background: none;
    border: 3px dashed #fff;
    padding: 0;
    pointer-events: auto;
  }
  .token.unknown .token-inner.mover {
    display: none;
  }
  .mover.fade {
    transform: scale(0) !important;
    opacity: 0 !important;
  }
  .parens:after {
    content: '';
    position: absolute;
    left: -10px;
    top: -10px;
    bottom: -10px;
    width: 8px;
    border-left: solid 3px #fff;
    border-radius: 50%;
  }
  .parens:before {
    content: '';
    position: absolute;
    right: -10px;
    top: -10px;
    bottom: -10px;
    width: 8px;
    border-right: solid 3px #fff;
    border-radius: 50%;
  }
</style>

<div class="token" class:unknown={token.unknown} class:parens={token.node.parens}>
  <DragDrop
    let:dragging
    let:hovering
    let:fade
    let:draghovering
    canDrag={!token.unknown}
    dragStart={handleDragStart}
    dropReceive={handleDropReceive}
    dragLeave={handleDragLeave}
    dragHover={handleDragHover}>
    <div
      slot="dropzone"
      class="token-inner no-highlight dropzone"
      class:dragging
      class:hovering
      class:draghovering>
      {#if token.unknown}
        <input size={1} on:change={handleUpdateToken} />
      {:else}
        <div>{value}</div>
      {/if}
    </div>
    <div
      slot="mover"
      class="token-inner no-highlight mover"
      class:dragging
      class:hovering
      class:draghovering
      class:fade>
      {#if token.unknown}
        <div />
      {:else}
        <div>{value}</div>
      {/if}
    </div>
  </DragDrop>
</div>
