<script>
    import { droppable } from './droppable.js'
    import Flaggable from '../Flaggable.svelte'
	import { onMount } from 'svelte';

    const audioFiles = {
        dragStart: {file: 'pop.wav', volume: 0.45},
        dropRecieve: {file: 'click.wav', volume: 0.4},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('pop.wav');
    });
    
    export let error;
    export let hint;
    export let onDrop;

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
    }
    function handleDragExit(event) {
        dragover = false;
        hovering = false;
    }
    function handleDropReceive(event) {
        audioSource.src = audioFiles.dropRecieve.file;
        audioSource.volume = audioFiles.dropRecieve.volume;
        audioSource.play();
        if (onDrop)
            onDrop();
    }
</script>

<Flaggable error={error} hint={hint}>
    <div class="Droppable"
        class:hovering={hovering}
        class:dragover={dragover}
        use:droppable
        on:dragmouseenter={handleMouseEnter}
        on:dragmouseexit={handleMouseExit}
        on:dragenter={handleDragEnter}
        on:dragexit={handleDragExit}
        on:dropreceive={handleDropReceive}>
        <slot>Content</slot>
    </div>
</Flaggable>

<style>
    .Droppable {
        padding: 10px;
        border: #2220 3px solid;
        transition: border 0.25s ease;
        display: flex;
        border-radius: 4px;
    }
    .Droppable.hovering {
        border: #222 3px solid;
    }
    .Droppable.dragover {
        border: #33dcfe 3px solid;
    }
</style>