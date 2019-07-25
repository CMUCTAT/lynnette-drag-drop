<script>
    import { onMount, beforeUpdate } from 'svelte';
    export let state;
    let prevState;
    const stateMap = {
        default: {
            body: './images/lynnette-alien-body-neutral.png',
            face: './images/lynnette-alien-face-neutral.png',
        },
        error: {
            body: './images/lynnette-alien-body-point.png',
            face: './images/lynnette-alien-face-problem.png',
        },
        success: {
            body: './images/lynnette-alien-body-excited.png',
            face: './images/lynnette-alien-face-excited.png',
        }
    }
    $: body = stateMap[state] ? stateMap[state].body : stateMap.default.body;
    $: face = stateMap[state] ? stateMap[state].face : stateMap.default.face;

    const audioFiles = {
        error: {file: './audio/hmm.wav', volume: 0.5},
        success: {file: './audio/haHa.wav', volume: 0.5},
    }
    var audioSource;
    onMount(() => {
		audioSource = new Audio('./audio/hmm.wav');
    });
    function playSound(file, vol) {
        audioSource.src = file;
        audioSource.volume = vol;
        audioSource.play();
    }
    beforeUpdate(() => {
        if (state && state !== prevState && state !== 'default') {
            playSound(audioFiles[state].file, audioFiles[state].volume)
        }
        prevState = state;
    })

        
</script>

<div class="Alien">
    <img class="display alien-body" src={body} alt="">
    <img class="display alien-face" src={face} alt="">
</div>

<style>
    .Alien {
        position: relative;
        pointer-events: none;
    }
    .display {
        width: 85%;
    }
    .alien-face {
        position: absolute;
        top: 0;
        left: 0;
    }
</style>