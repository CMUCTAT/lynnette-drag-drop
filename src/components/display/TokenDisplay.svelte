<script>
  import { Token } from '../../classes.js';
  export let token;
  export let isSubtract = false;
</script>

<style>
  .token-display {
    text-align: center;
    vertical-align: middle;
  }
</style>

<div class="token-display">
  <span class="content">{token.value(isSubtract ? -1 : 1)}</span>
</div>
