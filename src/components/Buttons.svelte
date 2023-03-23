<div class="buttons">
  {#if error}
    <div class="UndoButton button">
      <button on:click={handleUndo}>
        <div class="icon">⤶</div>
        <div class="content">Undo</div>
      </button>
    </div>
  {/if}
  <div class="CTATHintButton button"/>
  <div class="CTATDoneButton button"/>
  {#if window.templates == 'planets'}
    <button class="mute" class:muted on:click={handleClick}>🔈</button>
  {/if}
</div>

<script>
  import { soundEffects } from '$utils/soundEffect.js'

  export let handleUndo
  export let error

  let muted = window.templates != 'planets' || document.cookie.split('muted=')[1] === 'true'
  soundEffects.mute(muted)

  function handleClick() {
    soundEffects.mute(!soundEffects._muted)
    muted = !muted
    document.cookie = 'muted=' + muted
  }
</script>

<style>
  .buttons {
    grid-area: buttons;
    justify-self: center;
    align-self: end;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .button :global(button) {
    border: none;
    border-radius: 8px;
    width: 100px;
    height: 100px;
    font-size: 30px;
    cursor: pointer;
    transition: transform 0.25s ease;
  }
  .button :global(button):hover {
    transform: scale(1.1);
  }
  .CTATHintButton :global(button) {
    color: #9e770a;
    background: #ffc954;
  }
  .CTATDoneButton :global(button) {
    font-size: 20px;
    color: #0c9769;
    background: #63fabb;
  }
  .UndoButton button {
    position: relative;
    color: #750c18;
    background: #f1384d;
  }
  .UndoButton {
    margin-bottom: 30px;
  }
  .UndoButton button:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    border: 3px solid #f1384d;
    border-radius: 10px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    opacity: 0;
    animation: ripple 1.5s infinite;
  }
  @keyframes ripple {
    0% {
      border-radius: 10px;
      width: 100%;
      height: 100%;
      opacity: 1;
    }
    100% {
      border-radius: 30px;
      width: 150%;
      height: 150%;
      opacity: 0;
    }
  }
  .mute {
    position: relative;
    border: none;
    padding: 0px;
    font-size: 30px;
    color: #fff;
    cursor: pointer;
    background: none;
  }
  .mute.muted:after {
    content: '❌';
    position: absolute;
    left: 0px;
  }
  @media only screen and (max-width: 820px) {
    .buttons {
      padding-bottom: 30px;
    }
    .button :global(button) {
      width: 70px;
      height: 70px;
      font-size: 20px;
    }
  }
</style>
