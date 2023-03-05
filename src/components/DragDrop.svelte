<script>
  import { spring } from 'svelte/motion';
  import { dragdrop } from './dragdrop.js';
  import { dragdropData } from '../stores/equation.js';
  import soundEffects from '../soundEffect.js';

  export let canDrag = true;
  export let canDragHover = true;
  export let id;

  export let dropSucceed = null;
  export let dropSend = null;
  export let dropReceive = null;
  export let dragStart = null;
  export let dragHover = null;
  export let dragLeave = null;

  let hovering = false;
  let dragging = false;
  let returning = false;
  let dragHovering = false;
  let dropAnim = false;

  let origin = { x: 0, y: 0 };

  const coords = spring(
    { x: 0, y: 0 },
    {
      stiffness: 0.05,
      damping: 0.15,
    },
  );

  function handleDragStart(event) {
    if (!canDrag) return;
    coords.stiffness = coords.damping = 1;
    dragging = true;
    soundEffects.play('pop');
    origin = { x: event.detail.x, y: event.detail.y };
    if (dragStart) dragStart(event);
  }

  function handleDragMove(event) {
    coords.update(($coords) => ({
      // x: $coords.x + event.detail.dx,
      // y: $coords.y + event.detail.dy,
      x: event.detail.x - origin.x,
      y: event.detail.y - origin.y,
    }));
  }

  function handleDragEnd(event) {
    coords.stiffness = 0.05;
    coords.damping = 0.15;
    coords.set({ x: 0, y: 0 });
    dragging = false;
    hovering = false;
    dragdropData.setDrag(null);
  }

  function handleMouseEnter(event) {
    hovering = true;
  }

  function handleMouseLeave(event) {
    hovering = false;
  }

  function handleDragEnter(event) {
    if (!canDragHover) return;
    dragHovering = true;
    if (dragHover) dragHover(event);
  }

  function handleDragLeave(event) {
    if (!canDragHover) return;
    dragHovering = false;
    if (dragLeave) dragLeave(event);
  }

  function handleDropSend(event) {
    handleMouseLeave(event);
    if (dropSucceed === null || dropSucceed()) {
      coords.stiffness = coords.damping = 1;
      dropAnim = true;
      setTimeout(() => {
        coords.set({ x: 0, y: 0 });
        dropAnim = false;
        dragging = false;
      }, 300);
      soundEffects.play('click');
      if (dropSend) dropSend(event);
    } else {
      handleDragEnd(event);
    }
    dragdropData.setDrag(null);
  }

  function handleDropReceive(event) {
    if (!canDragHover) return;
    handleDragLeave(event);
    if (dropReceive) dropReceive(event);
  }
</script>

<style>
  .dragdrop {
    position: relative;
  }
  .dragdrop-mover {
    cursor: pointer;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  .dragging .dragdrop-mover {
    z-index: 1000;
    opacity: 0.5;
  }
</style>

<div
  class="dragdrop"
  {id}
  use:dragdrop={{ type: 'dragdrop', canDrag }}
  on:dragstart={handleDragStart}
  on:dragmove={handleDragMove}
  on:dragend={handleDragEnd}
  on:enter={handleMouseEnter}
  on:leave={handleMouseLeave}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dropsend={handleDropSend}
  on:dropreceive={handleDropReceive}
  class:dragging
  class:returning
  class:hovering
  class:draghovering={dragHovering}>
  <div class="dragdrop-dropzone">
    <slot name="dropzone" {dragging} draghovering={dragHovering} hovering={hovering && !dropAnim} />
  </div>
  <div class="dragdrop-mover" style="transform: translate({$coords.x}px,{$coords.y}px)">
    <slot
      name="mover"
      {dragging}
      draghovering={dragHovering}
      hovering={hovering && !dropAnim}
      fade={dropAnim} />
  </div>
</div>
