<script>
    import { Operator, Expression, Token } from '../../stores/classes.js';
    import { draftEquation, dropData, dragData } from '../../stores/equation.js'
	import OperatorComponent from './Operator.svelte';
    import TokenComponent from './Token.svelte';
    
    import { droppable } from '../dragdrop/droppable.js'
    import Flaggable from '../Flaggable.svelte'
    import { onMount } from 'svelte';
    
    export let expression;
    export let path;
    export let parentDivide;
    export let error;
    export let hint;
    

    $: isDivide = expression.items.length > 1 && expression.items[1].equals('DIVIDE');

    const audioFiles = {
        dragStart: {file: './audio/pop.wav', volume: 0.45},
        dropRecieve: {file: './audio/click.wav', volume: 0.4},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('./audio/pop.wav');
    });

    let hovering = false;
    let dragover = false;

    function handleMouseEnter(event) {
        event.stopPropagation();
        hovering = true;
    }
    function handleMouseExit(event) {
        event.stopPropagation();
        hovering = false;
        dragover = false;
    }
    function handleDragEnter(event) {
        event.stopPropagation();
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
        draftEquation.apply();
    }
</script>

<Flaggable error={error} hint={hint} size={110}>
    <div class="Expression"
        class:divide={isDivide}
        class:parentheses={expression.items.length > 1 && !expression.items[1].equals('DIVIDE') && path.split(",").length > 1 && !parentDivide}
        class:hovering={hovering}
        class:dragover={dragover}
        use:droppable={{type: "expression", accepts:["token", "operator"]}}
        on:dragmouseenter={handleMouseEnter}
        on:dragmouseexit={handleMouseExit}
        on:dragenter={handleDragEnter}
        on:dragexit={handleDragExit}
        on:dropreceive={handleDropReceive}>
        {#each expression.items as item, i}
            {#if item instanceof Operator}
                <OperatorComponent operator={item} path={path + "," + i} hint={item.hint} error={item.error} />
            {:else if item instanceof Expression}
                <svelte:self expression={item} path={path + "," + i} parentDivide={isDivide} hint={item.hint} error={item.error} />
            {:else if item instanceof Token}
                <TokenComponent token={item} path={path + "," + i} hint={item.hint} error={item.error} />
            {/if}
        {/each}
    </div>
</Flaggable>

<style>
    .Expression {
        padding: 15px;
        border: #fff0 3px solid;
        transition: border 0.25s ease;
        border-radius: 4px;
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
        border: #fff 3px solid;
    }
    .Expression.dragover {
        border: #ffe364 3px solid;
        cursor: pointer;
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
        border-left: solid 3px #fff;
        border-radius: 50%;
    }
    .Expression.parentheses:before {
        content: '';
        position: absolute;
        right: 0px;
        top: 0;
        bottom: 0;
        width: 8px;
        border-right: solid 3px #fff;
        border-radius: 50%;
    }
</style>