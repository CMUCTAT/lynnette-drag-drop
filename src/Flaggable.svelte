<script>
    export let error;
    export let hint;
</script>

<div class="Flaggable"
    class:error={error}
    class:hint={hint}>
    <slot></slot>
</div>

<style>
    .Flaggable {
        position: relative;
    }
    .Flaggable:before {
        content: '';
        position: absolute;
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