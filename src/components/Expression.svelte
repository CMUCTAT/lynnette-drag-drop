<DragDrop id={expression.id} canDrag={false}
          dragLeave={handleDragLeave} dragHover={handleDragHover}
          let:dragging let:hovering let:draghovering>
  <div slot="dropzone" class="expression no-highlight dropzone"
       class:dragging class:hovering class:draghovering
       class:divide={bottom.length > 0} class:parens={expression.node.parens}>
    <div class="factor">
      {#each top as item, index (item.id || item + index)}
        {#if item instanceof ExpressionNode}
          <svelte:self expression={item}/>
        {:else if item instanceof TokenNode}
          <Token token={item} isSubtract={isAdd && index > 0 && item.node.sign < 0}/>
        {:else}
          <Operator operator={item} siblings={[top[index - 1], top[index + 1]]}/>
        {/if}
      {/each}
    </div>
    {#if bottom.length > 0}
      <div class="bar"/>
      <div class="factor">
        {#each bottom as item, index (item.id || item + index)}
          {#if item instanceof ExpressionNode}
            <svelte:self expression={item}/>
          {:else if item instanceof TokenNode}
            <Token token={item}/>
          {:else}
            <Operator operator={item} siblings={[bottom[index - 1], bottom[index + 1]]}/>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</DragDrop>

<script>
  import { TokenNode, ExpressionNode } from '$utils/classes.js'
  import Operator from '$components/Operator.svelte'
  import Token from '$components/Token.svelte'
  import DragDrop from '$components/DragDrop.svelte'
  import { draftEquation, dragdropData } from '$stores/equation.js'

  export let expression

  let isAdd = expression.node.operator === 'PLUS',
      top = expression.items,
      bottom = []

  $: if (expression) {
    isAdd = expression.node.operator === 'PLUS'
    top = insertOperators(
      isAdd ? expression.items : expression.items.filter((item) => item.node.exp > 0),
      isAdd,
    )
    bottom = isAdd ? [] : insertOperators(expression.items.filter((item) => item.node.exp < 0))
  }

  function insertOperators(items, isAdd = true) {
    return items.reduce((array, item, index) =>
      isAdd && index === 0 ? [item] :
      isAdd ? array.concat([item.node.sign > 0 ? 'PLUS' : 'MINUS', item]) :
      index === 0 || isDistribution(item, items[index - 1]) ? array.concat(item) :
      array.concat(['TIMES', item]), []
    )
  }

  function isDistribution(item, prevItem) {
    return (item.node.parens || prevItem.node.parens) && expression.node.operator === 'TIMES'
  }

  function handleDragLeave(event) {
    dragdropData.setDrop(null)
  }

  function handleDragHover(event) {
    dragdropData.setDrop(expression)
    draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop)
    event.stopPropagation()
  }

  // function handleDoubleClick(event) {
  //   draftEquation.draftOperation(siblings[0], siblings[1])
  //   draftEquation.apply()
  // }
</script>

<style>
  .expression {
    border: #fff0 3px solid;
    border-radius: 5px;
    box-sizing: border-box;
    padding: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.25s ease;
  }
  :global(.operator) + :global(.dragdrop) .expression:not(.parens) {
    padding-inline: 0px;
  }
  .parens:before {
    content: '';
    position: absolute;
    left: 3px;
    top: 0px;
    bottom: 0px;
    border-left: solid 3px #fff;
    border-radius: 50%;
    width: 8px;
  }
  .parens:after {
    content: '';
    position: absolute;
    right: 3px;
    top: 0px;
    bottom: 0px;
    border-right: solid 3px #fff;
    border-radius: 50%;
    width: 8px;
  }
  .hovering.dropzone {
    border: #fff 3px solid;
  }
  .draghovering.dropzone {
    border: var(--drag-highlight-color) 3px solid;
  }
  .factor {
    margin-block: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .factor:has(.operator) {
    margin-block: 0px;
  }
  .divide {
    flex-direction: column;
  }
  .bar {
    margin: 5px 0px;
    border-radius: 3px;
    width: 100%;
    height: 3px;
    background: #fff;
  }
</style>
