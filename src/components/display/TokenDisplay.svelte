<div class="token-display">
    <span class="content">{token.constant == null ? "□" : token.value()}</span>
</div>

<script>
    export let token;
</script>


<style>
	.token-display {
        text-align: center;
        vertical-align: middle;
    }
</style>