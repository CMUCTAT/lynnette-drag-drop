import { Equation, Token, UnknownToken, Expression } from "./classes.js";

export function parseGrammar(expression, parent = null, parentIndex = null) {
  //return different things depending on what the node's operator is
  if (expression.operator === "EQUAL") {
    let operands = parse.algGetOperands(expression);
    let eqn = new Equation(null); //null equation has to be made first to pass it in as a parent
    eqn.left = parseGrammar(operands[0], eqn);
    eqn.right = parseGrammar(operands[1], eqn);
    return eqn;
  } else if (expression.operator === "CONST") {
    return new Token(parent, [expression], [parentIndex]);
  } else if (expression.operator === "VAR") {
    return new Token(parent, [expression], [parentIndex]);
  } else if (expression.operator === "UMINUS") {
    return new Token(parent, [expression], [parentIndex]);
  } else if (expression.operator === "UNKNOWN") {
    return new UnknownToken(parent, expression, [parentIndex]);
  } else if (expression.operator === "PLUS") {
    let operands = parse.algGetOperands(expression);
    let exp = new Expression(parent, expression, []);
    exp.items = operands.map((node, i) => parseGrammar(node, exp, i));
    return exp;
  } else if (expression.operator === "TIMES") {
    let operands = parse.algGetOperands(expression);
    let exp = new Expression(parent, expression, []);
    let items = groupNodes(exp, operands);
    if (items.length === 1) return items[0];
    exp.items = items;
    return exp;
  } else {
    //this shouldn't happen, but nulls are just ignored by the interface renderer
    return null;
  }
}

function groupNodes(parent, nodes) {
  if (nodes.length === 1) return nodes;
  const groups = [];
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (
      node.operator === "VAR" &&
      groups.length > 0 &&
      groups[groups.length - 1][0].exp === node.exp
    ) {
      groups[groups.length - 1].push(node);
    } else {
      groups.push([node]);
    }
  }
  return groups.map((group) => {
    if (group.length === 1)
      return parseGrammar(
        group[0],
        parent,
        group.map((n) => nodes.indexOf(n))
      );
    else
      return new Token(
        parent,
        group,
        group.map((n) => nodes.indexOf(n))
      );
  });
}
