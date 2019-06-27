<script>
    export let error;
    export let hint;
    export let styles;
</script>

<div class="Flaggable"
    class:error={error}
    class:hint={hint}
    style={styles}>
    <slot></slot>
</div>

<style>
    .Flaggable {
        position: relative;
    }
    .Flaggable:before {
        pointer-events: none;
        content: '';
        position: absolute;
        z-index: -1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60%;
        height: 60%;
        border-radius: 110%;
        background: #fff0;
        transition: background 0.3s ease, width 0.3s ease, height 0.3s ease;
    }
    .hint:before {
        width: 110%;
        height: 110%;
        background: #fff04e;
    }
    .error:before {
        width: 110%;
        height: 110%;
        background: #ff3341;
    }
</style>