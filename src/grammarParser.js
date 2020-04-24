import {
  Equation,
  Token,
  UnknownToken,
  Expression,
  PlusOperator,
  MinusOperator,
  TimesOperator,
  DivideOperator,
} from "./classes.js";

function flattenPath(path) {
  return path.join(",").split(",");
}

/**
 * Transforms algebra grammar tree from CTATAlgebraParser into EquationNode interpretable by the interface
 * @export
 * @param {CTATAlgebraNode} expression grammar to transform into an EquationNode
 * @param {EquationNode} [parent=null] the parent of the passed in node; will be automatically set recursively
 * @param {int} [parentIndex=null] the index of the passed in node relative to its parent
 * @param {bool} [ignoreSign=false] should constants take the sign of their expression; only used when constructing PLUS operations with minuses to properly display numbers as e.g. 1 - 2 not 1 + -2
 * @returns EquationNode transformed tree
 */
export function parseGrammar(expression, parent = null, parentIndex = null, ignoreSign = false) {
  //return different things depending on what the node's operator is
  if (expression.operator === "EQUAL") {
    let operands = parse.algGetOperands(expression);
    let eqn = new Equation(null); //null equation has to be made first to pass it in as a parent
    eqn.left = parseGrammar(operands[0], eqn);
    eqn.right = parseGrammar(operands[1], eqn);
    return eqn;
  } else if (expression.operator === "CONST") {
    return new Token(
      parent,
      flattenPath(expression.path),
      (ignoreSign ? 1 : expression.sign) * expression.value,
      null,
      parentIndex
    );
  } else if (expression.operator === "VAR") {
    return new Token(
      parent,
      flattenPath(expression.path),
      expression.sign,
      expression.variable,
      parentIndex
    );
  } else if (expression.operator === "UMINUS") {
    return new Token(
      parent,
      flattenPath(expression.path),
      -expression.base.value,
      null,
      parentIndex
    );
  } else if (expression.operator === "UNKNOWN") {
    return new UnknownToken(parent, flattenPath(expression.path), parentIndex);
  } else if (expression.operator === "PLUS") {
    let operands = parse.algGetOperands(expression);
    let exp = new Expression(parent, flattenPath(expression.path), [], expression.parens > 0);
    exp.nodes = operands.reduce((acc, e, i) => {
      let node = parseGrammar(e, exp, i, i > 0);
      return i > 0
        ? acc.concat(
            e.sign > 0
              ? new PlusOperator(parent, flattenPath(expression.path))
              : new MinusOperator(parent, flattenPath(expression.path)),
            node
          )
        : acc.concat(node);
    }, []);
    return exp;
  } else if (expression.operator === "TIMES") {
    let operands = parse.algGetOperands(expression);
    let nodes = operands.reduce((acc, e, i) => {
      //parse nodes, but remember their exponent so we can sort it into top or bottom
      let node = parseGrammar(e, null, i); //these nodes won't have a parent yet; it'll be set later once we determine which expression it's the child of
      return acc.concat({ exp: e.exp, node });
    }, []);
    let topNodes = [];
    let bottomNodes = [];
    nodes.forEach((e) => {
      //sort nodes into top or bottom exponent^1 is on top exponent^-1 is on bottom
      if (e.exp >= 0) {
        topNodes.push(e.node);
      } else {
        bottomNodes.push(e.node);
      }
    });
    if (bottomNodes.length > 0) {
      //if there are bottom nodes then create division expression with top and bottom nodes in their respective places
      let exp = new Expression(parent, flattenPath(expression.path), [], expression.parens > 0);
      exp.nodes = [
        combineConstVars(topNodes, exp, flattenPath(expression.path)),
        new DivideOperator(parent, flattenPath(expression.path)),
        combineConstVars(bottomNodes, exp, flattenPath(expression.path)),
      ];
      return exp;
    } else {
      //if there aren't any bottom nodes, then create a multiplication expression
      return combineConstVars(topNodes, parent, flattenPath(expression.path));
    }
  } else {
    //this shouldn't happen, but nulls are just ignored by the interface renderer
    return null;
  }
}

/**
 * Given a list of nodes, combine neigbor constants and variables into single tokens and returns the resulting nodes as a single expression
 * NOTE: this should only be called on lists of nodes in TIMES expressions
 * @param {array of EquationNode} nodes nodes which will be combined
 * @param {EquationNode} parent parent of the passed in nodes
 * @returns EquationNode expression of combined nodes
 */
function combineConstVars(nodes, parent, path) {
  if (nodes.length === 1) {
    //if there's only one node, then set the parent of that node to the original parent, then return it alone
    nodes[0].parent = parent;
    return nodes[0];
  }
  let exp = new Expression(parent, path, []);
  for (let i = 0; i < nodes.length; i++) {
    if (i === nodes.length - 1) {
      //if we're at the last node, just add it to the expression
      nodes[i].parent = exp;
      exp.nodes.push(nodes[i]);
    } else if (
      nodes[i] instanceof Token &&
      nodes[i].constant &&
      nodes[i + 1] instanceof Token &&
      nodes[i + 1].variable
    ) {
      //if the current node is a constant and the next a variable, combine them into a single token and add it to the expression
      exp.nodes.push(
        new Token(
          exp,
          path,
          nodes[i].constant,
          nodes[i + 1].variable,
          nodes[i].startIndex,
          nodes[i + 1].stopIndex
        )
      );
      i++;
    } else {
      //otherwise, add the node and a times operator
      nodes[i].parent = exp;
      exp.nodes.push(nodes[i]);
      exp.nodes.push(new TimesOperator(parent, path));
    }
  }
  if (exp.nodes.length === 1) {
    //if, after combining, there's only one element, then ignore the new expression, set that node's parent to the original parent and return it
    exp.nodes[0].parent = parent;
    return exp.nodes[0];
  }
  return exp;
}
