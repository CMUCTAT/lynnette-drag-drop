<script>
    import Equation from './Equation.svelte';

    export let state;
    export let draft;
    let showDraft;

    function handleMove(e) {
        if (Object.keys(window.drag).some(key => window.drag[key])) {
            showDraft = true;
        }
    }
    function handleMouseLeave(e) {
        showDraft = false;
    }
    function handleMouseUp(e) {
        showDraft = false;
    }
</script>

<div class="root"
    on:mousemove={handleMove}
    on:mouseleave={handleMouseLeave}
    on:mouseup={handleMouseUp}>
    <Equation state={state}/>
    {#if showDraft }
        <div class="preview">
            <Equation state={draft}/>
        </div>
    {/if}
</div>

<style>
    .root {
        position: relative;
    }
    .preview {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0.3;
        pointer-events: none;
    }
    .preview:before {
		content: '';
		width: 0; 
		height: 0; 
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid #444;
		position: absolute;
		left: 50%;
		transform: translate(-50%);
		top: -4px;
	}
</style>