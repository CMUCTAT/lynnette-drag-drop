<script>
  import { afterUpdate, beforeUpdate } from 'svelte';

  import { Token, Expression } from '../classes.js';
  import ExpressionComponent from './Expression.svelte';
  import Operator from './Operator.svelte';
  import TokenComponent from './Token.svelte';
  import DragDrop from './DragDrop.svelte';
  import { draftEquation, dragdropData } from '../stores/equation.js';

  export let expression;
  let isAdd = expression.node.operator === 'PLUS';
  let top = expression.items;
  let bottom = [];

  function insertOperators(items, isAdd = true) {
    if (isAdd)
      return items.reduce((a, c, i) => {
        return i === 0 ? [c] : a.concat([c.node.sign > 0 ? 'PLUS' : 'MINUS', c]);
      }, []);
    else
      return items.reduce(
        (a, c, i) =>
          i === 0 || isDistribution(c, items[i - 1]) ? a.concat(c) : a.concat(['TIMES', c]),
        [],
      );
  }

  function isDistribution(item, prevItem) {
    return (item.node.parens || prevItem.node.parens) && expression.node.operator === 'TIMES';
  }

  $: if (expression) {
    isAdd = expression.node.operator === 'PLUS';
    top = insertOperators(
      isAdd ? expression.items : expression.items.filter(item => item.node.exp > 0),
      isAdd,
    );
    bottom = isAdd ? [] : insertOperators(expression.items.filter(item => item.node.exp < 0));
  }
</script>

<style>
  .expression {
    padding: 5px;
    display: flex;
    align-items: center;
    justify-items: center;
    box-sizing: border-box;
    border-radius: 5px;
    border: #fff0 3px solid;
    transition: all 0.25s ease;
  }
  .parens:after {
    content: '';
    position: absolute;
    left: 2px;
    top: 0;
    bottom: 0;
    width: 8px;
    border-left: solid 3px #fff;
    border-radius: 50%;
  }
  .parens:before {
    content: '';
    position: absolute;
    right: 2px;
    top: 0;
    bottom: 0;
    width: 8px;
    border-right: solid 3px #fff;
    border-radius: 50%;
  }
  .hovering.dropzone {
    border: #fff 3px solid;
  }
  .draghovering.dropzone {
    border: var(--drag-highlight-color) 3px solid;
  }
  .item-display {
    display: flex;
    align-items: center;
    justify-items: center;
  }
  .divide {
    flex-direction: column;
  }
  .vinculum {
    width: 100%;
    height: 3px;
    border-radius: 3px;
    background: #fff;
    margin: 5px 0;
  }
</style>

<DragDrop
  let:dragging
  let:hovering
  let:draghovering
  canDrag={false}
  dropReceive={() => draftEquation.apply()}
  dragLeave={() => {
    dragdropData.setDrop(null);
  }}
  dragHover={() => {
    dragdropData.setDrop(expression);
    draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop);
  }}>
  <div
    slot="dropzone"
    class="expression no-highlight dropzone"
    class:dragging
    class:hovering
    class:draghovering
    class:divide={bottom.length > 0}
    class:parens={expression.node.parens}>
    <div class="item-display top">
      {#each top as item, i (item.id || item + i)}
        {#if item instanceof Expression}
          <svelte:self expression={item} />
        {:else if item instanceof Token}
          <TokenComponent token={item} isSubtract={i > 0 && item.node.sign < 0} />
        {:else}
          <Operator operator={item} siblings={[top[i - 1], top[i + 1]]} />
        {/if}
      {/each}
    </div>
    {#if bottom.length > 0}
      <div class="vinculum" />
      <div class="item-display bottom">
        {#each bottom as item, i (item.id || item + i)}
          {#if item instanceof Expression}
            <svelte:self expression={item} />
          {:else if item instanceof Token}
            <TokenComponent token={item} />
          {:else}
            <Operator operator={item} siblings={[bottom[i - 1], bottom[i + 1]]} />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</DragDrop>
