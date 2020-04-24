import { writable, get } from "svelte/store";
// import { history } from './history.js';
import {
  Equation,
  Token,
  Expression,
  Operator,
  PlusOperator,
  MinusOperator,
  TimesOperator,
  DivideOperator,
  UnknownToken,
} from "../classes.js";
import { history } from "./history";

function createDragdropData() {
  const { subscribe, set, update } = writable({ drag: null, drop: null });
  return {
    subscribe,
    setDrag: (node) => update((state) => Object.assign(state, { drag: node })),
    setDrop: (node) => update((state) => Object.assign(state, { drop: node })),
  };
}
export const dragdropData = createDragdropData();
const parse = new CTATAlgebraParser();
window.parse = parse;

const initial = null;

// Contains data that will be used in draftOperation.apply() to create an SAI for the Tutor
let dragOperation = {
  side: null,
  from: null,
  to: null,
};

/**
 * Creates an draftEquation store, which can be globally accessed and updated by any Svelte element;
 * convenient to apply draft operations from any child component without needing to provide it a function as a prop
 * @param {CTATAlgebraTreeNode} initial the initial state of the equation
 */
function createDraftEquation() {
  // let initial = window.parse.algParse('2*(3+2)/(4/x) = 1 - ?');
  const { subscribe, set, update } = writable(initial);

  /**
   * Will perform a draft operation on the equation, i.e. will change the equation, but not write to history
   *
   * @param {EquationNode} src the source EquationNode
   * @param {EquationNode} dest the destination EquationNode
   * @param {*} eqn the current equation
   * @returns new modified equation
   */
  function draftOperation(src, dest, eqn) {
    eqn = get(history).current; //the draft equation will always reset to the head of the history stack before applying draft operations; otherwise the draft would be multiple steps ahead of the current equation

    // eqn = initial;
    if (src === dest)
      //if src and dest are the same, we're dragging an node onto itself, so nothing happens
      return eqn;
    //we determine what to do based on what the src and dest is
    //some of these may never trigger given how the interface manages type checking for its drag/drop operations
    console.log(src, dest);
    if (src instanceof Token) {
      if (dest instanceof Token) {
        return tokenToToken(src, dest, eqn);
      } else if (dest instanceof Expression) {
        return tokenToExpression(src, dest, eqn);
      } else if (dest instanceof Operator) {
        return tokenToOperator(src, dest, eqn);
      } else {
        throw new TypeError("Drag destination is not a proper item type");
      }
    } else if (src instanceof Expression) {
      if (dest instanceof Token) {
        return expressionToToken(src, dest, eqn);
      } else if (dest instanceof Expression) {
        return expressionToExpression(src, dest, eqn);
      } else if (dest instanceof Operator) {
        return expressionToOperator(src, dest, eqn);
      } else {
        throw new TypeError("Drag destination is not a proper item type");
      }
    } else if (src instanceof Operator) {
      if (dest instanceof Token) {
        return operatorToToken(src, dest, eqn);
      } else if (dest instanceof Expression) {
        return operatorToExpression(src, dest, eqn);
      } else if (dest instanceof Operator) {
        return operatorToOperator(src, dest, eqn);
      } else {
        throw new TypeError("Drag destination is not a proper item type");
      }
    } else {
      throw new TypeError("Drag source is not a proper item type");
    }
  }

  /**
   * Pushes the current draft equation onto the history stack and sends an SAI to the Tutor describing the operation that has been performed
   *
   * @param {*} eqn the current draft equation
   * @returns the current draft equation (shouldn't have been modified)
   */
  function apply(eqn) {
    let sai = new CTATSAI(
      dragOperation.side,
      dragOperation.from + "To" + dragOperation.to,
      parse.algStringify(eqn)
    );
    console.log(`%c${sai.toXMLString()}`, "color: #15f");

    if (CTATCommShell.commShell) {
      CTATCommShell.commShell.processComponentAction(sai);
    }
    if (
      get(history).current !== eqn &&
      parse.algStringify(get(history).current) !== parse.algStringify(eqn)
    ) {
      history.push(eqn);
    }
    return eqn;
  }

  /**
   * Updates an unknown token with a value in the case where a student *types* in a value into an UnknownToken; dragging a value to an UnknownToken is accounted for in draftOperation
   *
   * @param {*} eqn the current draft equation
   * @param {UnknownToken} token the token being modified
   * @param {string|number} value the value to put in the token
   * @returns modified equation
   */
  function updateToken(eqn, token, value) {
    eqn = get(history).current;
    dragOperation = { from: "Update", to: "Token", side: token.path[0] };
    let target = Object.path(eqn, token.path);
    let newToken = parse.algParse(value);
    newToken.sign = target.sign;
    newToken.exp = target.exp;
    let next = parse.algReplaceExpression(eqn, target, newToken);
    return apply(next);
  }

  return {
    subscribe,
    draftOperation: (src, dest) => update((eqn) => draftOperation(src, dest, eqn)),
    updateToken: (token, value) => update((eqn) => updateToken(eqn, token, value)),
    apply: () => update((eqn) => apply(eqn)),
    reset: () => set(initial),
    set: (eqn) => set(eqn),
  };
}

export const draftEquation = createDraftEquation();

/**
 * Extends Object with the path function which traverses an object via the specified path array
 * e.g. Object.path({a: {b: c: ['foo', 'bar']}}, ['a', 'b', 'c', 1]) returns 'bar'
 */
Object.path = (o, p) => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

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
  dragOperation = { from: "Token", to: "Token", side: dest.path[0] };
  if (dest instanceof UnknownToken) {
    let d = Object.path(eqn, dest.path);
    let s = parse.algParse(src.value());
    s.exp = d.exp;
    s.sign = d.sign; //have to do this because the grammar will otherwise take the sign of the source e.g. 1 - ? (drag 1 to ?) results in 1 + 1 not 1 - 1 as expected
    return parse.algReplaceExpression(eqn, d, s);
  } else if (src.parent === dest.parent) {
    let parentPath = src.path.slice(0, -2);
    let parent = Object.path(eqn, parentPath);
    let indices = src.indices.concat(dest.indices);
    indices.sort();
    let next = parse.algReplaceExpression(
      eqn,
      parent,
      parse.algApplyRulesSelectively(parent, ["combineSimilar"], false, ...indices)
    );
    parent = Object.path(next, parentPath);
    return parse.algReplaceExpression(
      next,
      parent,
      parse.algApplyRules(parent, ["removeIdentity"])
    );
  } else {
    return eqn;
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
  dragOperation = { from: "Token", to: "Expression", side: dest.path[0] };
  if (src.parent === dest.parent && !(src.parent instanceof Equation)) {
    let parent = Object.path(eqn, src.path.slice(0, -2));
    let i0 = parseInt(src.path.slice(-1)[0]);
    let i1 = parseInt(dest.path.slice(-1)[0]);
    return parse.algReplaceExpression(
      eqn,
      parent,
      parse.algApplyRulesSelectively(parent, ["distribute", "removeIdentity"], false, i0, i1)
    );
  } else {
    return eqn;
  }
}

/**
 * When a token is dragged on an operator, then nothing happens, because that doesn't make sense
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function tokenToOperator(src, dest, eqn) {
  dragOperation = { from: "Token", to: "Operator", side: dest.path[0] };
  return eqn;
}

function expressionToToken(src, dest, eqn) {
  dragOperation = { from: "Expression", to: "Token", side: dest.path[0] };
}

function expressionToExpression(src, dest, eqn) {
  dragOperation = { from: "Expression", to: "Expression", side: dest.path[0] };
}

/**
 * When an expression is dragged on an operator, then nothing happens, because that doesn't make sense
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function expressionToOperator(src, dest, eqn) {
  dragOperation = { from: "Expression", to: "Operator", side: dest.path[0] };
  return eqn;
}

function operatorToToken(src, dest, eqn) {
  dragOperation = { from: "Operator", to: "Token", side: dest.path[0] };
  let subexp;
  let indices = dest.indices;
  if (indices > 1) {
    indices.sort();
    let parent = Object.path(eqn, dest.path.slice(0, -2));
    subexp = parse.algGetExpression(parent, ...indices);
  } else {
    subexp = Object.path(eqn, dest.path);
  }
  let next = parse.algReplaceExpression(
    parse.algParse(parse.algStringify(eqn)),
    subexp,
    parse.algCreateExpression(src.operation, subexp, "?")
  );
  //TODO, unless I do parse.algParse(parse.algStringify(eqn)), the eqn is broken, breaking the history. It seems to be modifying eqn in place, not immutably
  return next;
}

function operatorToExpression(src, dest, eqn) {
  dragOperation = { from: "Operator", to: "Expression", side: dest.path[0] };
  // eqn = parse.algParse(parse.algStringify(eqn)); // TODO Weird error unless we do this;
  // console.log(eqn);

  // the grammar returns null on algReplaceExpression() if the token is dragged over the 9, then the ? in 3x + 6 = 9 /?, but not if the 9 is avoided
  let d = Object.path(eqn, dest.path);
  let next = parse.algReplaceExpression(eqn, d, parse.algCreateExpression(src.operation, d, "?"));

  return parse.algParse(parse.algStringify(next)); //TODO parentheses won't be included in grammar tree unless we do this; it will stringify nicely, but not remember parens in the object
}

/**
 * When an operator is dragged on an operator, then nothing happens, because it's probably too much of a hassle to rework the equation
 * @param {Object} src source object containing the node and its path
 * @param {Object} dest destination object containing the node and its path
 * @param {CTATAlgebraTreeNode} eqn the current equation
 */
function operatorToOperator(src, dest, eqn) {
  //TODO this should be technically feasible to code, but it's probably not necessary to implement
  dragOperation = { from: "Operator", to: "Operator", side: dest.path[0] };
  return eqn;
}
