const generateID = () => Math.random().toString(36).substr(2, 9);

class EquationNode {
  constructor(parent, node) {
    this.parent = parent;
    this.node = node;
    this.id = generateID();
  }
}

export class Equation extends EquationNode {
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

export class Token extends EquationNode {
  constructor(parent, nodes, indices, hideSign = false) {
    super(parent, nodes[0]);
    this.nodes = nodes;
    this.indices = indices;
    this.hideSign = hideSign;
  }

  stringify() {
    return this.value;
  }
  value() {
    let sign = this.nodes.reduce((sign, node) => (sign *= node.sign), 1);
    return (
      (this.hideSign ? '' : sign.toString().replace('1', '')) +
      this.nodes.map((node) => node.value || node.variable || -node.base.value).join('')
    );
  }
}

export class UnknownToken extends Token {
  constructor(parent, node, indices) {
    super(parent, [node], indices);
    this.unknown = true;
  }
  value() {
    return '□';
  }
}

export class Expression extends EquationNode {
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
