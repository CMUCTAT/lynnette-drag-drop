<div class="history-token" class:parens={token.node.parens}>
  <span class="content" class:unknown={token instanceof UnknownTokenNode}>
    {token.value(isSubtract ? -1 : 1)}
  </span>
</div>

<script>
  import { UnknownTokenNode } from '$utils/classes.js'

  export let token
  export let isSubtract = false
</script>

<style>
  .history-token {
    position: relative;
    text-align: center;
  }
  .history-token.parens {
    margin-inline: 6px;
    padding-inline: 2px;
  }
  .history-token.parens:before, .history-token.parens:after {
    content: '';
    position: absolute;
    top: 0px;
    bottom: 0px;
    border-radius: 75%;
    width: 8px;
  }
  .history-token.parens:before {
    left: -3px;
    border-left: solid 2px #333;
  }
  .history-token.parens:after {
    right: -3px;
    border-right: solid 2px #333;
  }
  .content.unknown {
    line-height: 20px;
    font-size: 30px;
  }
</style>
