<DragDrop id={expression.id} canDrag={false}
          dragLeave={handleDragLeave} dragHover={handleDragHover}
          let:dragging let:hovering let:draghovering>
  <div slot="dropzone" class="expression no-highlight dropzone"
       class:dragging class:hovering class:draghovering
       class:divide={bottom.length} class:parens={expression.node.parens}>
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
    {#if bottom.length}
      <div class="bar"/>
      <div class="factor">
        {#each bottom as item, index (item.id || item + index)}
          {#if item instanceof ExpressionNode}
            <svelte:self expression={item}/>
          {:else if item instanceof TokenNode}
            <Token token={item} {depth}/>
          {:else}
            <Operator operator={item} siblings={[bottom[index - 1], bottom[index + 1]]}/>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</DragDrop>

<script>
  import Operator from '$components/Operator.svelte'
  import Token from '$components/Token.svelte'
  import DragDrop from '$components/DragDrop.svelte'
  import { draftEquation, dragdropData } from '$stores/equation.js'
  import { TokenNode, ExpressionNode } from '$utils/classes.js'

  export let expression

  let isAdd = expression.node.operator === 'PLUS',
      top = expression.items,
      bottom = [],
      depth = 0

  $: if (expression) {
    isAdd = expression.node.operator === 'PLUS'
    top = insertOperators(isAdd ? expression.items : expression.items.filter(item => item.node.exp > 0), isAdd)
    bottom = insertOperators(isAdd ? [] : expression.items.filter(item => item.node.exp < 0))
    if (bottom.length) depth = getDepth(expression) - 1
  }

  function insertOperators(items, isAdd = true) {
    return items.reduce((array, item, index) =>
      index === 0 || !isAdd && (item.node.parens || items[index - 1].node.parens) ? array.concat(item) :
      isAdd ? array.concat([item.node.sign > 0 ? 'PLUS' : 'MINUS', item]) :
      array.concat(['TIMES', item]), []
    )
  }

  function getDepth(expression) {
    return expression.items ? 1 + expression.items.max(item => getDepth(item)) : 0
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
    padding-inline: 5px;
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
    border-radius: 75%;
    width: 16px;
  }
  .parens:after {
    content: '';
    position: absolute;
    right: 3px;
    top: 0px;
    bottom: 0px;
    border-right: solid 3px #fff;
    border-radius: 75%;
    width: 16px;
  }
  .hovering.dropzone {
    border: #fff 3px solid;
  }
  .draghovering.dropzone {
    border: var(--drag-highlight-color) 3px solid;
  }
  .factor {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .divide {
    flex-direction: column;
  }
  .bar {
    margin-block: 5px;
    border-radius: 3px;
    width: 100%;
    height: 3px;
    background: #fff;
  }
</style>
