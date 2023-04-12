<div id="hint-window" class="CTATHintWindow"
     class:visible={$showMessages} class:translucent={$dragdropData.drag}>
  <span class="error-hint" class:visible={$showMessages && $error}>! Press the Undo Button !</span>
</div>

<script>
  import { dragdropData } from '$stores/equation.js'
  import { showMessages, error } from '$stores/messageManager.js'
</script>

<style>
  #hint-window {
    grid-area: hints;
    justify-self: center;
    align-self: center;
    z-index: 1000;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 10px 10px;
    border-radius: 10px;
    box-sizing: border-box;
    min-inline-size: 300px;
    max-inline-size: 600px;
    inline-size: 50vw;
    block-size: 130px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    opacity: 0;
    font-size: 16px;
    background: #f5f4f3;
    transition: all 0.25s ease;
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
</style>
