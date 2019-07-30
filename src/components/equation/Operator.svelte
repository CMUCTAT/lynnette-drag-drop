<script>
    import { draftEquation, dropData, dragData } from '../../stores/equation.js'
	import { spring } from 'svelte/motion';
	import { onMount } from 'svelte';
    import { draggable } from '../dragdrop/draggable.js';
	import { history } from '../../stores/history.js';
    import Flaggable from '../Flaggable.svelte'

    export let operator;
    export let path;
    export let error;
    export let hint;
    
    $: isDivide = operator.equals('DIVIDE') && path !== '';  


    const audioFiles = {
        resolveError: {file: './audio/error.mp3', volume: 0.4},
        resolveSuccess: {file: './audio/click.wav', volume: 0.45},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('./audio/click.wav');
    });
    
    function handleDoubleClick(event) {
        let success = draftEquation.resolveOperator(path);
        audioSource.src = success ? audioFiles.resolveSuccess.file : audioFiles.resolveError.file;
        audioSource.volume = success ? audioFiles.resolveSuccess.volume : audioFiles.resolveError.volume;
        audioSource.play();
        draftEquation.apply();
    }

    let fadeAnimTime = 300;
</script>

<Flaggable error={error} hint={hint} size={110} divide={isDivide}>
    <div class="Operator" class:divide={isDivide} on:dblclick={handleDoubleClick}>
        <div class="content">{isDivide ? '' : operator.symbol}</div>
    </div>
</Flaggable>

<style>
	.Operator {
        touch-action: none;
		position: relative;
		cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    .Operator:hover .content {
        color: var(--drag-highlight-color);
        /* transform: scale(1.2); */
    }
    .content {
        touch-action: none;
        transition: transform 0.25s ease;
        pointer-events: none;
		transition: color 0.2s ease, transform 0.2s ease;
    }
    .content {
        min-width: var(--size);
        line-height: 33px;
        font-size: 28px;
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
        background: #fff;
		transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
    }
    .Operator:hover .content:after {
        background: var(--drag-highlight-color);
    }
</style>