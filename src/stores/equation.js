import { writable, get } from 'svelte/store'
import { EquationNode, TokenNode, ExpressionNode, UnknownTokenNode, Operators } from '$utils/classes.js'
import { parseGrammar } from '$utils/grammarParser.js'
import { history } from '$stores/history.js'
import { error } from '$stores/messageManager.js'

function createDragdropData() {
  const { subscribe, set, update } = writable({ drag: null, drop: null })
  return {
    subscribe,
    setDrag: (node) => update((state) => Object.assign(state, { drag: node })),
    setDrop: (node) => update((state) => Object.assign(state, { drop: node })),
  }
}
export const dragdropData = createDragdropData()

const initial = null

// Contains data that will be used in draftOperation.apply() to create an SAI for the Tutor
let dragOperation = {
  side: null,
  from: null,
  to: null,
}

/**
 * Creates an draftEquation store, which can be globally accessed and updated by any Svelte element;
 * convenient to apply draft operations from any child component without needing to provide it a function as a prop
 * @param {CTATAlgebraTreeNode} initial the initial state of the equation
 */
function createDraftEquation() {
  const { subscribe, set, update } = writable(initial)

  /**
   * Will perform a draft operation on the equation, i.e. will change the equation, but not write to history
   *
   * @param {Node} src the source Node
   * @param {Node} dest the destination Node
   * @param {*} eqn the current equation
   * @returns new modified equation
   */
  function draftOperation(src, dest, eqn) {
    eqn = get(history).current //the draft equation will always reset to the head of the history stack before applying draft operations; otherwise the draft would be multiple steps ahead of the current equation

    if (src === dest)
      //if src and dest are the same, we're dragging an node onto itself, so nothing happens
      return eqn
    //we determine what to do based on what the src and dest is
    //some of these may never trigger given how the interface manages type checking for its drag/drop operations
    if (src instanceof TokenNode) {
      if (dest instanceof TokenNode) {
        return tokenToToken(src, dest, eqn)
      } else if (dest instanceof ExpressionNode) {
        return tokenToExpression(src, dest, eqn)
      } else if (Object.keys(Operators).includes(dest)) {
        return tokenToOperator(src, dest, eqn)
      } else {
        throw new TypeError('Drag destination is not a proper item type')
      }
    } else if (src instanceof ExpressionNode) {
      if (dest instanceof TokenNode) {
        return expressionToToken(src, dest, eqn)
      } else if (dest instanceof ExpressionNode) {
        return expressionToExpression(src, dest, eqn)
      } else if (Object.keys(Operators).includes(dest)) {
        return expressionToOperator(src, dest, eqn)
      } else {
        throw new TypeError('Drag destination is not a proper item type')
      }
    } else if (Object.keys(Operators).includes(src)) {
      if (dest instanceof TokenNode) {
        return operatorToToken(src, dest, eqn)
      } else if (dest instanceof ExpressionNode) {
        return operatorToExpression(src, dest, eqn)
      } else if (Object.keys(Operators).includes(dest)) {
        return operatorToOperator(src, dest, eqn)
      } else {
        throw new TypeError('Drag destination is not a proper item type')
      }
    } else {
      throw new TypeError('Drag source is not a proper item type')
    }
  }

  /**
   * Pushes the current draft equation onto the history stack and sends an SAI to the Tutor describing the operation that has been performed
   *
   * @param {*} eqn the current draft equation
   * @returns the current draft equation (shouldn't have been modified)
   */
  function apply(eqn) {
    if (!eqn) return undefined
    try {
      parseGrammar(eqn)
    } catch (exception) {
      console.error(exception)
      return undefined
    }
    let sai = new CTATSAI(dragOperation.side, dragOperation.from + 'To' + dragOperation.to, window.parser.algStringify(eqn))

    if (CTATCommShell.commShell) {
      CTATCommShell.commShell.processComponentAction(sai)
    }
    error.set(null)
    history.push(eqn)
    // if (get(history).current !== eqn &&
    //     window.parser.algStringify(get(history).current) !== window.parser.algStringify(eqn)) {
    //   history.push(eqn)
    // }
    return eqn
  }

  /**
   * Updates an unknown token with a value in the case where a student *types* in a value into an UnknownTokenNode; dragging a value to an UnknownTokenNode is accounted for in draftOperation
   *
   * @param {*} eqn the current draft equation
   * @param {UnknownTokenNode} token the token being modified
   * @param {string|number} value the value to put in the token
   * @returns modified equation
   */
  function updateToken(eqn, token, value) {
    eqn = get(history).current
    let path = flattenPath(token.node.path)
    dragOperation = { from: 'Update', to: 'Token', side: path[0] }
    let target = Object.path(eqn, path),
        newToken = window.parser.algParse(value).popNegation()
    if (newToken.sign === -1) {
      newToken = window.parser.algParse(`(${value})`)
    }
    newToken.sign *= target.sign
    newToken.exp = target.exp
    let next = window.parser.algReplaceExpression(eqn, target, newToken)
    next = window.parser.algParse(window.parser.algStringify(next))
    return apply(next)
  }

  return {
    subscribe,
    draftOperation: (src, dest) => update((eqn) => draftOperation(src, dest, eqn)),
    updateToken: (token, value) => update((eqn) => updateToken(eqn, token, value)),
    apply: () => update((eqn) => apply(eqn)),
    reset: () => set(initial),
    set: (eqn) => set(eqn),
  }
}

export const draftEquation = createDraftEquation()

/**
 * Extends Object with the path function which traverses an object via the specified path array
 * e.g. Object.path({a: {b: c: ['foo', 'bar']}}, ['a', 'b', 'c', 1]) returns 'bar'
 */
Object.path = (object, path) => path.reduce((object, key) => (object && object[key] ? object[key] : null), object)

function flattenPath(path) {
  return path.join(',').split(',')
}

/**
 * When a token is dragged onto a token, the following should happen:
 * if the destination is the unknown operator ("?"), then replace its value with the source's value and return the result
 * else if the two tokens have the same parent (of the same expression), then combine them with respect to their operators
 * else this drag operation is not algebraically valid, thus nothing happens
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function tokenToToken(src, dest, eqn) {
  let srcPath = flattenPath(src.node.path),
      destPath = flattenPath(dest.node.path)
  dragOperation = { from: 'Token', to: 'Token', side: destPath[0] }
  if (dest instanceof UnknownTokenNode) {
    let isSubtract = src.node.operator == 'UMINUS'
    dest = Object.path(eqn, flattenPath(dest.node.path))
    let next = window.parser.algParse(src.value())
    if (isSubtract) {
      next = window.parser.algParse(`(${src.value(src.node.sign < 0 ? -1 : 1)})`)
    }
    next.exp = dest.exp
    next.sign = dest.sign //have to do this because the grammar will otherwise take the sign of the source e.g. 1 - ? (drag 1 to ?) results in 1 + 1 not 1 - 1 as expected
    next = window.parser.algReplaceExpression(eqn, dest, next)
    next = window.parser.algParse(window.parser.algStringify(next))
    return next
  } else if (src.parent === dest.parent && !(src.parent instanceof EquationNode)) {
    let parentPath = srcPath.slice(0, -2),
        parent = Object.path(eqn, parentPath),
        indices = src.indices.concat(dest.indices)
    indices.sort()

    let next = window.parser.algApplyRulesSelectively(parent, ['flatten', 'computeConstants', 'combineSimilar', 'removeIdentity'], true, ...indices)
    if (next.value == 0 && next.sign == -1) next.sign = 1
    next = window.parser.algReplaceExpression(eqn, parent, next)

    parent = Object.path(next, parentPath)
    next = window.parser.algReplaceExpression(next, parent, window.parser.algApplyRules(parent, ['removeIdentity']))
    next = window.parser.algParse(window.parser.algStringify(removeParens(next)))
    return next
  } else {
    return eqn
  }
}

/**
 * When a token is dragged onto an expression, the following should happen:
 * if the two items have the same parent (of the same expression), distribute the token upon the expression
 * else nothing happens
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function tokenToExpression(src, dest, eqn) {
  let srcPath = flattenPath(src.node.path),
      destPath = flattenPath(dest.node.path)
  dragOperation = { from: 'Token', to: 'Expression', side: destPath[0] }

  if (src.parent === dest.parent && !(src.parent instanceof EquationNode)) {
    let parent = Object.path(eqn, srcPath.slice(0, -2)),
        i0 = parseInt(srcPath.at(-1)),
        i1 = parseInt(destPath.at(-1)),
        dist = window.parser.algApplyRulesSelectively(parent, ['distribute'], false, i0, i1),
        next = window.parser.algReplaceExpression(eqn, parent, dist)

    //TODO: this shouldn't be necessary, but without it (1+x)/k -> k + x/k (where k has a negative exponent), it only happens with 1/k; this is because of removeIdentity
    next = window.parser.algParse(window.parser.algStringify(removeParens(next)))
    return next
  } else {
    return eqn
  }
}

/**
 * When a token is dragged on an operator, then nothing happens, because that doesn't make sense
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function tokenToOperator(src, dest, eqn) {
  dragOperation = { from: 'Token', to: 'Operator', side: flattenPath(dest.node.path)[0] }
  return eqn
}

function expressionToToken(src, dest, eqn) {
  dragOperation = { from: 'Expression', to: 'Token', side: flattenPath(dest.node.path)[0] }
}

function expressionToExpression(src, dest, eqn) {
  dragOperation = { from: 'Expression', to: 'Expression', side: flattenPath(dest.node.path)[0] }
}

/**
 * When an expression is dragged on an operator, then nothing happens, because that doesn't make sense
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function expressionToOperator(src, dest, eqn) {
  dragOperation = { from: 'Expression', to: 'Operator', side: flattenPath(dest.node.path)[0] }
  return eqn
}

function operatorToToken(src, dest, eqn) {
  let destPath = flattenPath(dest.node.path)
  dragOperation = { from: 'Operator', to: 'Token', side: destPath[0] }

  let subexp,
      indices = dest.indices
  if (indices.length > 1) {
    indices.sort()
    let parent = Object.path(eqn, destPath.slice(0, -2))
    subexp = window.parser.algGetExpression(parent, ...indices)
  } else {
    subexp = Object.path(eqn, destPath)
  }
  let next = window.parser.algReplaceExpression(eqn, subexp, window.parser.algCreateExpression(src, subexp, '?'))
  //TODO: unless I do window.parser.algParse(window.parser.algStringify(eqn)), the eqn is broken, breaking the history. It seems to be modifying eqn in place, not immutably
  next = window.parser.algParse(window.parser.algStringify(removeParens(next)))
  return next
}

function operatorToExpression(src, dest, eqn) {
  let destPath = flattenPath(dest.node.path)
  dragOperation = { from: 'Operator', to: 'Expression', side: destPath[0] }
  // eqn = window.parser.algParse(window.parser.algStringify(eqn)); // TODO Weird error unless we do this

  // the grammar returns null on algReplaceExpression() if the token is dragged over the 9, then the ? in 3x + 6 = 9 /?, but not if the 9 is avoided
  let sub = Object.path(eqn, destPath),
      next = window.parser.algReplaceExpression(eqn, sub, window.parser.algCreateExpression(src, sub, '?'))
  next = window.parser.algParse(window.parser.algStringify(removeParens(next))) //TODO parentheses won't be included in grammar tree unless we do this; it will stringify nicely, but not remember parens in the object
  return next
}

/**
 * When an operator is dragged on an operator, then nothing happens, because it's probably too much of a hassle to rework the equation
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function operatorToOperator(src, dest, eqn) {
  //TODO this should be technically feasible to code, but it's probably not necessary to implement
  dragOperation = { from: 'Operator', to: 'Operator', side: flattenPath(dest.node.path)[0] }
  return eqn
}

function removeParens(exp) {
  exp.parens = 0
  if (exp instanceof CTATRelationNode) {
    exp.left.parens = 0
    exp.right.parens = 0
  }
  return exp
}
