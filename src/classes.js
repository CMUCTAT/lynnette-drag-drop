import {immerable} from 'immer'

function parseTree(node) {
    if (/* RelationNode */) {
        return new Equation(parseTree(/* RelationNode.left */), parseTree(/* RelationNode.right */));
    }
    if (/* Unary node */) {

    } else if (/* Add Node */) {
        let items = []
        node.terms.foreach((term, i) => {
            if (i > 0) { 
                items.push(term.sign > 0 ? add() : subtract());
            }
            items.push(parseTree(term));
        })
    } else if (/* Mult Node */) {
        if (node.terms.every(term => term instanceof CTATConstantNode || term instanceof CTATVariableNode)) {
            return new Token();
        } else {
            let items = []
            node.terms.foreach((term, i) => {
                if (i > 0) { 
                    if (term.exp > 0) { 
                        items.push(mult());
                    }
                }
                items.push(parseTree(term));
            })
        }
    }
}

function generateID() {
	return Math.random().toString(36).substr(2, 9);
}

export class Expression {
    constructor(items) {
        this[immerable] = true
        this.items = items;
        this.id = generateID();
    }

    stringify() {
        return "(" + this.items.map(item => item.stringify()).join(" ") + ")";
    }
}

export class Token {
    // [immerable] = true
    constructor(constant, variable, editable=false) {
        this[immerable] = true
        this.constant = constant;
        this.variable = variable;
        this.editable = editable;
        this.id = generateID();
    }

    stringify() {
        return this.constant + (this.variable ? this.variable : '');
    }
}

export class Operator {
    constructor(symbol, operation) {
        this[immerable] = true
        this.symbol = symbol;
        this.operation = operation;
        this.id = generateID();
    }
    equals(other) {
        return other instanceof Operator && other.symbol === this.symbol && other.operation === this.operation
    }
    stringify() {
        return this.symbol;
    }
}

const addOp = (op0, op1) => {
    console.log("ADD OPERATION ->", op0, op1);
}
export const add = () => new Operator('+', addOp);

const subtractOp = (op0, op1) => {
    console.log("SUBTRACT OPERATION ->", op0, op1);
}
export const subtract = () => new Operator('-', subtractOp);

const multiplyOp = (op0, op1) => {
    console.log("MULTIPLY OPERATION ->", op0, op1);
}
export const multiply = () => new Operator('×', multiplyOp);

const divideOp = (op0, op1) => {
    console.log("DIVIDE OPERATION ->", op0, op1);
}
export const divide = () => new Operator('÷', divideOp);

export class Equation {
    constructor(left, right) {
        this[immerable] = true
        this.left = left;
        this.right = right;
        this.id = generateID();
    }
    
    stringify() {
        return this.left.stringify() + " = " +  this.right.stringify();
    }
}










// class Operation {
//     constructor(symbol, terms) {
//         this[immerable] = true
//         this.symbol = symbol;
//         this.terms = terms;
//     }
// }
// export class Addition extends Operation {
//     constructor(terms) {
//         super('+', terms);
//     }
// }
// export class Subtraction extends Operation {
//     constructor(terms) {
//         super('-', terms);
//     }
// }
// export class Multiplication extends Operation {
//     constructor(terms) {
//         super('×', terms);
//     }
// }
// export class Division extends Operation {
//     constructor(terms) {
//         super('÷', terms);
//     }
// }

// class Term {
//     constructor(value) {
//         this[immerable] = true
//         this.value = value;
//     }
// }

// export class Constant extends Term {
//     constructor(value) {
//         super(value);
//     }
// }
// export class Variable extends Term {
//     constructor(value) {
//         super(value);
//     }
// }

// export class Equation {
//     constructor(left, right) {
//         this[immerable] = true
//         this.left = left;
//         this.right = right;
//     }
// }