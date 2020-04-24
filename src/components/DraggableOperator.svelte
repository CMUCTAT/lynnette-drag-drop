<script>
    import DragDrop from './DragDrop.svelte';
	import { draftEquation, dragdropData } from '../stores/equation.js'
    import { DivideOperator } from '../classes.js';

    export let operator;
    export let onlySymbol = false;
    let isDivide = !onlySymbol && operator instanceof DivideOperator;
</script>

<div class="draggable-operator">
    <DragDrop
        let:dragging={dragging}
        let:hovering={hovering}
        let:draghovering={draghovering}
        let:fade={fade}
        canDragHover={false}
        dragStart={() => dragdropData.setDrag(operator)}
        dropReceive={() => draftEquation.apply()}>
        <div slot="dropzone" class="operator no-highlight dropzone" class:dragging class:hovering class:draghovering>
            <div class="no-highlight" class:divide={isDivide}>
                {#if !isDivide}{operator.symbol}{/if}
            </div>
        </div>
        <div slot="mover" class="operator no-highlight mover" class:dragging class:hovering class:draghovering class:fade>
            <div class="no-highlight" class:divide={isDivide}>
                {#if !isDivide}{operator.symbol}{/if}
            </div>
        </div>
    </DragDrop>
</div>

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