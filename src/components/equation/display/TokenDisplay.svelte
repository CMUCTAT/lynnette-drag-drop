<div class="TokenDisplay">
    <span class="content">{token.constant == null ? "□" : token.constant + (token.variable ? token.variable : '')}</span>
</div>

<script>
    export let token;
    export let path;
</script>


<style>
	.TokenDisplay {
        text-align: center;
        vertical-align: middle;
    }
</style>