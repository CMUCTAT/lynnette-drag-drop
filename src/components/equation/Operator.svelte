<script>
    import { draftEquation, dropData, dragData } from '../../stores/equation.js'
	import { divide } from '../../stores/operators.js';
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
    import { draggable } from '../dragdrop/draggable.js';
    import Flaggable from '../Flaggable.svelte'

    export let operator;
    export let path;

    export let styles;
    export let error;
    export let hint;

    let isDivide = operator.equals(divide()) && path;  


    const audioFiles = {
        dragStart: {file: 'pop.wav', volume: 0.25},
        dropRecieve: {file: 'click.wav', volume: 0.3},
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
</script>

<Flaggable error={error} hint={hint} styles={isDivide ? "width: 100%;" : ""}>
    <div class="Operator"
        class:divide={isDivide}
        class:dragging={dragging}
        class:hovering={hovering && !dropAnim}
        class:onTop={dragging || (Math.abs($coords.x) + Math.abs($coords.y) > 0.1)}
        use:draggable={{type: "operator", accepts: []}}
        on:dragstart={handleDragStart}
        on:dragmove={handleDragMove}
        on:dragend={handleDragEnd}
        on:dragmouseenter={handleMouseEnter}
        on:dragmouseexit={handleMouseExit}
        on:dragenter={handleDragEnter}
        on:dragexit={handleDragExit}
        on:dropsend={handleDropSend}
        on:mouseup={() => {dragover = false;}}>
        <div class="content">{isDivide ? '' : operator.symbol}</div>
        <div class="mover"
            class:fade={dropAnim}
            style="transform:
            translate({$coords.x}px,{$coords.y}px)">
            <div class="content">{isDivide ? '' : operator.symbol}</div>
        </div>
    </div>
</Flaggable>

<style>
	.Operator {
        color: #fff0;
        touch-action: none;
		position: relative;
		transition: -webkit-text-stroke-color 0.2s ease;
		cursor: move;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: #2220;
    }
	.Operator.dragging {
        -webkit-text-stroke-color: #222;
	}
	.Operator.onTop .mover {
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
		color: #444;
		transition: color 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
        -webkit-text-stroke-width: 0;
    }
    .Operator.hovering .content {
        transform: scale(1.2);
    }
    .Operator.dragging .content {
        transform: scale(1.3);
    }
    .Operator.dragover .content {
        color: #33dcfe;
        transform: scale(1.2);
    }
    .Operator.divide.hovering .content {
        transform: none;
    }
    .Operator.divide.dragging .content {
        transform: none;
    }
    .Operator.divide.dragover .content {
        transform: none;
    }
    .fade .content {
        transform: scale(0);
        opacity: 0;
    }
    :root {
        --size: 50px;
    }
    .content {
        width: var(--size);
        height: var(--size);
        line-height: 40px;
        font-size: 40px;
        text-align: center;
    }
    .Operator.divide {
        width: 100%;
    }
    .Operator.divide .content {
        width: 100%;
        height: 24px;
        position: relative;
    }
    .Operator.divide .content:after {
        content: '';
        position: absolute;
        top: 50%;
        top: 10px;
        bottom: 10px;
        border-radius: 4px;
        left: 3px;
        right: 3px;
        pointer-events: none;
        border: #4440 solid 1px;
		transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
    }
    .mover > .content:after {
        background: #444;
    }
    .Operator.divide.dragging .content:after {
        border-color: #444;
    }
    .Operator.divide.hovering .content:after {
        transform: scale(1.2);
    }
    .Operator.divide.dragging .content:after {
        transform: scale(1.1);
    }
    .Operator.divide.dragover .content:after {
        background: #33dcfe;
        transform: scale(1.2);
    }
</style>