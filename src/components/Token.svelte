<div class="token" class:unknown={token.unknown} class:parens={token.node.parens}>
  <DragDrop id={token.id} canDrag={!token.unknown}
            dragStart={handleDragStart} dropSend={handleDropSend} dragHover={handleDragHover}
            dragLeave={handleDragLeave} dropSucceed={handleDropSucceed}
            let:dragging let:hovering let:draghovering let:fade>
    <div slot="dropzone" class="token-inner no-highlight dropzone"
         class:disabled={$error} class:dragging class:hovering class:draghovering>
      {#if token.unknown}
        <input on:change={handleUpdateToken}/>
      {:else}
        <div>{value}</div>
      {/if}
    </div>
    <div slot="mover" class="token-inner no-highlight mover"
         class:dragging class:hovering class:draghovering class:fade>
      {#if token.unknown}
        <div/>
      {:else}
        <div>{value}</div>
      {/if}
    </div>
  </DragDrop>
</div>

<script>
  import DragDrop from '$components/DragDrop.svelte'
  import { error } from '$stores/messageManager.js'
  import { draftEquation, dragdropData } from '$stores/equation.js'

  export let token
  export let isSubtract = false

  function handleDragStart(event) {
    dragdropData.setDrag(token)
  }

  function handleDragLeave(event) {
    dragdropData.setDrop(null)
  }

  function handleDragHover(event) {
    dragdropData.setDrop(token)
    draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop)
    event.stopPropagation()
  }

  function handleDropSend(event) {
    draftEquation.apply()
  }

  function handleUpdateToken(event) {
    draftEquation.updateToken(token, event.target.value)
  }

  function handleDropSucceed() {
    return $dragdropData.drag && $dragdropData.drag.parent !== $dragdropData.drop
  }

  $: value = token.value(isSubtract ? -1 : 1)
</script>

<style>
  .token {
    position: relative;
    margin: 10px;
    flex: 0;
  }
  @media only screen and (max-width: 820px) {
    .token {
      margin-inline: 5px;
    }
  }
  .token-inner {
    border-radius: 5px;
    box-sizing: border-box;
    min-width: 58px;
    height: 58px;
    padding: 10px;
    text-align: center;
    line-height: 37px;
    font-size: 35px;
    color: #333;
    background: #fff;
    pointer-events: none;
    transition: all 0.25s ease;
  }
  .dropzone.token-inner {
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: #fff0;
    color: #fff0;
    background: none;
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
    margin: 0px;
    outline: none;
    border: none;
    width: 100%;
    height: 100%;
    padding: 8px;
    text-align: center;
    color: #fff;
    background: none;
  }
  .token.unknown .token-inner {
    border: 3px dashed #fff;
    padding: 0px;
    background: none;
    pointer-events: auto;
  }
  .token.unknown .token-inner.mover {
    display: none;
  }
  .mover.fade {
    transform: scale(0) !important;
    opacity: 0 !important;
  }
  .parens:before {
    content: '';
    position: absolute;
    left: -10px;
    top: -10px;
    bottom: -10px;
    border-left: solid 3px #fff;
    border-radius: 50%;
    width: 8px;
  }
  .parens:after {
    content: '';
    position: absolute;
    right: -10px;
    top: -10px;
    bottom: -10px;
    border-right: solid 3px #fff;
    border-radius: 50%;
    width: 8px;
  }
  .disabled {
    pointer-events: none !important;
  }
</style>
