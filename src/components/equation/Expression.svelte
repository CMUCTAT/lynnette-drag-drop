<script>
    import { Operator, Expression, Token } from '../../stores/classes.js';
    import { draftEquation, dropData, dragData } from '../../stores/equation.js'
	import OperatorComponent from './Operator.svelte';
    import TokenComponent from './Token.svelte';
	import { divide } from '../../stores/operators.js';
    
    import { droppable } from '../dragdrop/droppable.js'
    import Flaggable from '../Flaggable.svelte'
    import { onMount } from 'svelte';
    
    export let expression;
    export let path;
    export let parentDivide;
    $: isDivide = expression.items.length > 1 && expression.items[1].equals(divide());

    const audioFiles = {
        dragStart: {file: 'pop.wav', volume: 0.25},
        dropRecieve: {file: 'click.wav', volume: 0.3},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('pop.wav');
    });
    
    export let error;
    export let hint;

    let hovering = false;
    let dragover = false;

    function handleMouseEnter(event) {
        hovering = true;
    }
    function handleMouseExit(event) {
        hovering = false;
        dragover = false;
    }
    function handleDragEnter(event) {
        dragover = true;
        dropData.set(expression, path, $dragData);
    }
    function handleDragExit(event) {
        dragover = false;
        hovering = false;
    }
    function handleDropReceive(event) {
        event.stopPropagation();
        audioSource.src = audioFiles.dropRecieve.file;
        audioSource.volume = audioFiles.dropRecieve.volume;
        audioSource.play();
        console.log($dragData, $dropData);
        
        draftEquation.apply();
    }
</script>

<Flaggable error={error} hint={hint} styles={"display: flex;"}>
    <div class="Expression"
        class:divide={isDivide}
        class:parentheses={expression.items.length > 1 && !expression.items[1].equals(divide()) && path.split(",").length > 1 && !parentDivide}
        class:hovering={hovering}
        class:dragover={dragover}
        use:droppable
        on:dragmouseenter={handleMouseEnter}
        on:dragmouseexit={handleMouseExit}
        on:dragenter={handleDragEnter}
        on:dragexit={handleDragExit}
        on:dropreceive={handleDropReceive}>
        {#each expression.items as item, i}
            {#if item instanceof Operator}
                <OperatorComponent operator={item} path={path + "," + i}/>
            {:else if item instanceof Expression}
                <svelte:self expression={item} path={path + "," + i} parentDivide={isDivide}/>
            {:else if item instanceof Token}
                <TokenComponent token={item} path={path + "," + i}/>
            {/if}
        {/each}
    </div>
</Flaggable>

<style>
    .Expression {
        padding: 15px;
        border: #4440 3px solid;
        transition: border 0.25s ease;
        display: flex;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        min-height: 40px;
        /* border: solid 2px #585BA8; */
        margin: 5px;
        display: flex;
        position: relative;
    }
    .Expression.hovering {
        border: #444 3px solid;
    }
    .Expression.dragover {
        border: #33dcfe 3px solid;
    }
    .Expression.divide {
        flex-direction: column;
    }
    .Expression.parentheses:after {
        content: '';
        position: absolute;
        left: 0px;
        top: 0;
        bottom: 0;
        width: 8px;
        border-left: solid 3px #444;
        border-radius: 50%;
    }
    .Expression.parentheses:before {
        content: '';
        position: absolute;
        right: 0px;
        top: 0;
        bottom: 0;
        width: 8px;
        border-right: solid 3px #444;
        border-radius: 50%;
    }
</style>