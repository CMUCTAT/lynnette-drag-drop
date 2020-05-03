const generateID = () => Math.random().toString(36).substr(2, 9);

class EquationNode {
  constructor(parent, path) {
    this.parent = parent;
    this.path = path;
    this.id = generateID();
  }
}

export class Equation extends EquationNode {
  constructor(left, right) {
    super(null, null);
    this.left = left;
    this.right = right;
  }

  stringify() {
    return this.left.stringify() + " = " + this.right.stringify();
  }
}

export class Token extends EquationNode {
  constructor(parent, path, constant, variable, ...indices) {
    super(parent, path);
    this.constant = constant;
    this.variable = variable;
    this.indices = indices;
  }
  stringify() {
    return this.value();
  }
  value() {
    const constant = this.variable ? this.constant.toString().replace("1", "") : this.constant;
    const variable = this.variable || "";
    return constant + variable;
  }
}

export class UnknownToken extends Token {
  constructor(parent, path, startIndex = null) {
    super(parent, path, null, null, startIndex, null);
    this.unknown = true;
  }
}

export class Expression extends EquationNode {
  constructor(parent, path, nodes, parens = false, ...indices) {
    super(parent, path);
    this.nodes = nodes;
    this.parens = parens;
    this.indices = indices;
  }
  stringify() {
    return "(" + this.nodes.map((item) => item.stringify()).join(" ") + ")";
  }
}

const Operations = { PLUS: "+", MINUS: "-", TIMES: "×", DIVIDE: "÷" };
export class Operator extends EquationNode {
  constructor(parent, path, symbol, operation) {
    super(parent, path);
    this.symbol = symbol;
    this.operation = operation;
  }
  equals(other) {
    return typeof other === "string" || other instanceof String
      ? this.symbol === other
      : other instanceof Operator && other.symbol === this.symbol;
  }
  stringify() {
    return this.symbol;
  }
}

export class PlusOperator extends Operator {
  constructor(parent, path) {
    super(parent, path, Operations.PLUS, "PLUS");
  }
}

export class MinusOperator extends Operator {
  constructor(parent, path) {
    super(parent, path, Operations.MINUS, "MINUS");
  }
}

export class TimesOperator extends Operator {
  constructor(parent, path) {
    super(parent, path, Operations.TIMES, "TIMES");
  }
}

export class DivideOperator extends Operator {
  constructor(parent, path) {
    super(parent, path, Operations.DIVIDE, "DIVIDE");
  }
}
