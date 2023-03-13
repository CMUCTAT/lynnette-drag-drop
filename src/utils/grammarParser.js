import { EquationNode, TokenNode, UnknownTokenNode, ExpressionNode, UMinusTokenNode, UPlusTokenNode } from '$utils/classes.js'

export function parseGrammar(expression, parent = null, parentIndex = null) {
  //return different things depending on what the node's operator is
  if (!expression) return null
  if (expression.operator === 'EQUAL') {
    let operands = window.parse.algGetOperands(expression),
        eqn = new EquationNode(null) //null equation has to be made first to pass it in as a parent
    eqn.left = parseGrammar(operands[0], eqn)
    eqn.right = parseGrammar(operands[1], eqn)
    return eqn
  } else if (expression.operator === 'CONST') {
    return new TokenNode(parent, [expression], [parentIndex])
  } else if (expression.operator === 'VAR') {
    return new TokenNode(parent, [expression], [parentIndex])
  } else if (expression.operator === 'UMINUS') {
    return new UMinusTokenNode(parent, [expression], [parentIndex])
  } else if (expression.operator === 'UPLUS') {
    return new UPlusTokenNode(parent, [expression], [parentIndex])
  } else if (expression.operator === 'UNKNOWN') {
    return new UnknownTokenNode(parent, expression, [parentIndex])
  } else if (expression.operator === 'PLUS') {
    let operands = window.parse.algGetOperands(expression),
        exp = new ExpressionNode(parent, expression, [])
    exp.items = operands.map((node, index) => parseGrammar(node, exp, index))
    return exp
  } else if (expression.operator === 'TIMES' || expression.operator === 'ITIMES') {
    let operands = window.parse.algGetOperands(expression),
        exp = new ExpressionNode(parent, expression, []),
        items = groupNodes(exp, operands)
    if (items.length === 1) {
      let token = items[0]
      if (token instanceof UMinusTokenNode) {
        token.node = {
          ...token.node,
          sign: token.node.sign * expression.sign,
          path: token.node.path.slice(0, -1)
        }
      } else {
        token.node = token.nodes[0] = {
          ...token.node,
          sign: token.node.sign * expression.sign,
          path: token.node.path.slice(0, -1)
        }
      }
      token.indices = [parentIndex]
      token.parent = parent
      return token
    }
    exp.items = items
    return exp
  } else {
    throw new TypeError("Grammar has type that isn't handled by the grammar parser")
  }
}

function groupNodes(parent, nodes) {
  if (nodes.length === 1) return nodes
  const groups = []
  nodes.forEach(node => {
    if (node.operator === 'VAR' &&
        groups.length > 0 &&
        groups[groups.length - 1][0].exp === node.exp)
      groups[groups.length - 1].push(node)
    else
      groups.push([node])
  })
  return groups.map(group =>
    group.length === 1 ?
      parseGrammar(group[0], parent, nodes.indexOf(group[0])) :
    group[0].operator === 'UMINUS' ?
      new UMinusTokenNode(parent, group, group.map(node => nodes.indexOf(node))) :
    new TokenNode(parent, group, group.map(node => nodes.indexOf(node))))
}
