<script>
    export let show;
</script>

<div class="context-menu" class:show={show}>
    <div class="operator">+</div>
    <div class="operator">-</div>
    <div class="operator">×</div>
    <div class="operator">÷</div>
</div>

<style>
    .context-menu.show {
        opacity: 1;
        pointer-events: all;
    }
    .context-menu {
        -webkit-text-stroke-width: 0;
        position: absolute;
        width: 70px;
        height: 70px;
        background: #3e7;
        right: calc(-100% - 10px);
        top: 0;
        opacity: 0;
        transition: opacity 0.25s ease;
        border-radius: 4px;
        z-index: 9;
        pointer-events: none;
        display: grid;
        grid-template-rows: 1fr 1fr;
        grid-template-columns: 1fr 1fr;
        border-radius: 4px;
        grid-gap: 5px;
        padding: 5px;
    }
    .operator {
        /* background: #3ba1ff; */
        line-height: normal;
        font-size: 20px;
        border-radius: 4px;
    }
    .operator:hover {
        background: #fff7;
    }
</style>