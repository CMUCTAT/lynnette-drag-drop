const generateID = () => Math.random().toString(36).substring(2, 11);

class Node {
  constructor(parent, node) {
    this.parent = parent;
    this.node = node;
    this.id = generateID();
  }
}

export class EquationNode extends Node {
  constructor(eqn, left, right) {
    super(null, eqn);
    this.left = left;
    this.right = right;
  }

  stringify() {
    return this.left.stringify() + ' = ' + this.right.stringify();
  }
}

// const values = this.nodes.map(
//       (node) =>
//         node.value * (this.hideSign ? 1 : node.sign) ||
//         node.variable ||
//         -node.base.value ||
//         '-' + node.base.variable,
//     );
//     if (values.length === 1) {
//       return values[0];
//     } else {
//       if (values[0].base) values[0] = values[0].base.toString().replace(/(^-?)1$/, '$1');
//       else values[0] = values[0].toString().replace(/(^-?)1$/, '$1');
//       return values.join('');
//     }

export class TokenNode extends Node {
  constructor(parent, nodes, indices, baseNode = null) {
    super(parent, baseNode || nodes[0]);
    this.nodes = nodes;
    this.indices = indices;
  }

  stringify() {
    return this.value();
  }
  value(mult = 1) {
    let sign = this.nodes
      .reduce((sign, cur) => cur.sign * sign, mult)
      .toString()
      .replace('1', '');
    return sign + this.nodes.map((n) => (n.value !== undefined ? n.value : n.variable)).join('');
  }
}

export class UMinusTokenNode extends TokenNode {
  constructor(parent, nodes, indices) {
    super(parent, [nodes[0].base, ...nodes.slice(1)], indices, nodes[0]);
  }
  value(mult = 1) {
    let sign = this.nodes
      .reduce((sign, cur) => cur.sign * sign, mult * -1 * this.node.sign)
      .toString()
      .replace('1', '');
    return `${sign}${super.value()}`;
  }
}

export class UPlusTokenNode extends TokenNode {
  constructor(parent, nodes, indices) {
    super(parent, [nodes[0].base, ...nodes.slice(1)], indices, nodes[0]);
  }
}

export class UnknownTokenNode extends TokenNode {
  constructor(parent, node, indices) {
    super(parent, [node], indices);
    this.unknown = true;
  }
  value() {
    return '□';
  }
}

export class ExpressionNode extends Node {
  constructor(parent, node, items) {
    super(parent, node);
    this.items = items;
  }
  stringify() {
    return '(' + this.items.map((item) => item.stringify()).join(' ') + ')';
  }
}

export const Operators = {
  PLUS: '+',
  MINUS: '-',
  TIMES: '×',
  DIVIDE: '÷',
};
