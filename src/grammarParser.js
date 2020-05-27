import { Equation, Token, UnknownToken, Expression, UMinusToken, UPlusToken } from './classes.js';

export function parseGrammar(expression, parent = null, parentIndex = null) {
  //return different things depending on what the node's operator is

  if (expression.operator === 'EQUAL') {
    let operands = parse.algGetOperands(expression);
    let eqn = new Equation(null); //null equation has to be made first to pass it in as a parent
    eqn.left = parseGrammar(operands[0], eqn);
    eqn.right = parseGrammar(operands[1], eqn);
    return eqn;
  } else if (expression.operator === 'CONST') {
    return new Token(parent, [expression], [parentIndex]);
  } else if (expression.operator === 'VAR') {
    return new Token(parent, [expression], [parentIndex]);
  } else if (expression.operator === 'UMINUS') {
    return new UMinusToken(parent, [expression], [parentIndex]);
  } else if (expression.operator === 'UPLUS') {
    return new UPlusToken(parent, [expression], [parentIndex]);
  } else if (expression.operator === 'UNKNOWN') {
    return new UnknownToken(parent, expression, [parentIndex]);
  } else if (expression.operator === 'PLUS') {
    let operands = parse.algGetOperands(expression);
    let exp = new Expression(parent, expression, []);
    exp.items = operands.map((node, i) => parseGrammar(node, exp, i));
    return exp;
  } else if (expression.operator === 'TIMES' || expression.operator === 'ITIMES') {
    let operands = parse.algGetOperands(expression);
    let exp = new Expression(parent, expression, []);
    let items = groupNodes(exp, operands);
    if (items.length === 1) {
      let token = items[0];
      if (token instanceof UMinusToken) {
        token.node = {
          ...token.node,
          sign: token.node.sign * expression.sign,
          path: token.node.path.slice(0, -1),
        };
      } else {
        token.node = token.nodes[0] = {
          ...token.node,
          sign: token.node.sign * expression.sign,
          path: token.node.path.slice(0, -1),
        };
      }
      token.indices = [parentIndex];
      token.parent = parent;
      return token;
    }
    exp.items = items;
    return exp;
  } else {
    throw new TypeError("Grammar has type that isn't handled by the grammar parser");
  }
}

function groupNodes(parent, nodes) {
  if (nodes.length === 1) return nodes;
  const groups = [];
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (
      node.operator === 'VAR' &&
      groups.length > 0 &&
      groups[groups.length - 1][0].exp === node.exp
    ) {
      groups[groups.length - 1].push(node);
    } else {
      groups.push([node]);
    }
  }
  return groups.map((group, i) => {
    if (group.length === 1) return parseGrammar(group[0], parent, nodes.indexOf(group[0]));
    else {
      if (group[0].operator === 'UMINUS') {
        return new UMinusToken(
          parent,
          group,
          group.map((n) => nodes.indexOf(n)),
        );
      } else {
        return new Token(
          parent,
          group,
          group.map((n) => nodes.indexOf(n)),
        );
      }
    }
  });
}
