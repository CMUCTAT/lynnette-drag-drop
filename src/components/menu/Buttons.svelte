<script>
  export let onUndo;
  export let error;
</script>

<style>
  .button :global(button) {
    font-size: 30px;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: transform 0.25s ease;
  }

  .button :global(button):hover {
    transform: scale(1.1);
  }

  .CTATHintButton :global(button) {
    background: #ffc954;
    color: #9e770a;
  }

  .CTATDoneButton :global(button) {
    background: #63fabb;
    color: #0c9769;
  }
  .UndoButton button {
    background: #f1384d;
    color: #750c18;
    position: relative;
  }
  .UndoButton {
    margin-bottom: 30px;
  }

  .UndoButton button:after {
    opacity: 0;
    content: "";
    width: 100%;
    height: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: absolute;
    border: 3px solid #f1384d;
    box-sizing: border-box;
    border-radius: 10px;
    z-index: 0;
    -webkit-animation: ripple 1.5s infinite;
    -moz-animation: ripple 1.5s infinite;
    -o-animation: ripple 1.5s infinite;
    animation: ripple 1.5s infinite;
  }

  @keyframes ripple {
    0% {
      opacity: 1;
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }
    100% {
      opacity: 0;
      width: 150%;
      height: 150%;
      border-radius: 30px;
    }
  }
</style>

<div>
  {#if error}
    <div class="UndoButton button">
      <button on:click={onUndo}>
        <div class="icon">⮌</div>
        <div class="content">Undo</div>
      </button>
    </div>
  {/if}
  <div class="CTATHintButton button" />
  <div class="CTATDoneButton button" />
</div>
