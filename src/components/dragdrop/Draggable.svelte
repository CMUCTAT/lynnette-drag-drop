<script>
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
    import { draggable } from './draggable.js';
    import Flaggable from '../Flaggable.svelte'

    export let styles;
    export let error;
    export let hint;


    const audioFiles = {
        dragStart: {file: './audio/pop.wav', volume: 0.45},
        dropRecieve: {file: './audio/click.wav', volume: 0.4},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('pop.wav');
	});

    let dragging = false;
    let hovering = false;
    let dragover = false;
    let dropAnim = false;

    let fadeAnimTime = 300;

	const coords = spring({ x: 0, y: 0 }, {
		stiffness: 0.05,
		damping: 0.3
	});

	function handleDragStart() {
		coords.stiffness = coords.damping = 1;
        dragging = true;
        audioSource.src = audioFiles.dragStart.file;
        audioSource.volume = audioFiles.dragStart.volume;
        audioSource.play();
	}

	function handleDragMove(event) {
		coords.update($coords => ({
			x: event.detail.x,
			y: event.detail.y
		}));
    }
    
    function handleDropSend(event) {
        dropAnim = true;
        hovering = false;
        setTimeout(() => {
            coords.set({ x: 0, y: 0 });
            dropAnim = false;
            dragging = false;
        }, fadeAnimTime)
    }

	function handleDragEnd(event) {
		coords.update($coords => ({
			x: event.detail.x,
			y: event.detail.y
		}));
        coords.stiffness = 0.05;
        coords.damping = 0.3;
        coords.set({ x: 0, y: 0 });
        dragging = false;
        hovering = false;
    }
    function handleMouseEnter(event) {
        hovering = true;
    }
    function handleMouseExit(event) {
        hovering = false;
        dragover = false;
    }
    function handleDragEnter(event) {
        dragover = true;
    }
    function handleDragExit(event) {
        dragover = false;
        hovering = false;
    }
    function handleDropReceive(event) {
        audioSource.src = audioFiles.dropRecieve.file;
        audioSource.volume = audioFiles.dropRecieve.volume;
        audioSource.play();
    }
    function dropValid(dropTarget) {

    }
</script>

<Flaggable error={error} hint={hint} styles={styles}>
    <div class="Draggable"
        class:dragging={dragging}
        class:hovering={hovering && !dropAnim}
        class:dragover={dragover}
        class:onTop={dragging || (Math.abs($coords.x) + Math.abs($coords.y) > 0.1)}
        use:draggable={dropValid || (() => true)}
        on:dragstart={handleDragStart}
        on:dragmove={handleDragMove}
        on:dragend={handleDragEnd}
        on:dragmouseenter={handleMouseEnter}
        on:dragmouseexit={handleMouseExit}
        on:dragenter={handleDragEnter}
        on:dragexit={handleDragExit}
        on:dropsend={handleDropSend}
        on:dropreceive={handleDropReceive}
        on:mouseup={() => {dragover = false;}}>
        <div class="content">
            <slot></slot>
        </div>
        <div class="mover"
            class:fade={dropAnim}
            style="transform:
            translate({$coords.x}px,{$coords.y}px)">
            <div class="content">
                <slot></slot>
            </div>
        </div>
    </div>
</Flaggable>

<style>
	.Draggable {
        color: #fff0;
        touch-action: none;
		position: relative;
		transition: -webkit-text-stroke-color 0.2s ease;
		cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: #fff0;
    }
	.Draggable.dragging {
        -webkit-text-stroke-color: #fff;
	}
	.Draggable.onTop .mover {
        z-index: 10;
    }
	.mover {
        touch-action: none;
        position: absolute;
        pointer-events: none;
		top: 0;
		left: 0;
        width: 100%;
        height: 100%;
    }
    .content {
        touch-action: none;
        transition: transform 0.25s ease;
    }
    .mover .content {
		color: #222;
		transition: color 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
        -webkit-text-stroke-width: 0;
    }
    .Draggable.hovering .content {
        transform: scale(1.2);
    }
    .Draggable.dragging .content {
        transform: scale(1.3);
    }
    .Draggable.dragover .content {
        color: #ffe364;
        transform: scale(1.2);
    }
    .fade .content {
        transform: scale(0);
        opacity: 0;
    }
</style>