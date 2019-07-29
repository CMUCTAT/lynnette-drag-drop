import { immerable, produce } from 'immer'

function generateID() {
	return Math.random().toString(36).substr(2, 9);
}

export class Expression {
    constructor(items, path) {
        this[immerable] = true
        this.items = items;
        this.path = path;
        this.hint = false;
        this.error = false;
        this.id = generateID();
    }

    stringify() {
        return "(" + this.items.map(item => item.stringify()).join(" ") + ")";
    }
}

export class Token {
    constructor(constant, variable, path, ...indices) {
        this[immerable] = true
        this.constant = constant;
        this.variable = variable;
        this.path = path;
        this.indices = indices;
        this.hint = false;
        this.error = false;
        this.id = generateID();
    }

    stringify() {
        return this.constant + (this.variable ? this.variable : '');
    }

    value() {
        return (!(this.variable && this.constant === 1) ? this.constant : '') + (this.variable || '')
    }
}

export class Operator {
    constructor(operation) {
        this[immerable] = true
        this.symbol = {PLUS: '+', MINUS: '-', TIMES: '×', DIVIDE: '÷'}[operation];
        this.operation = operation;
        this.hint = false;
        this.error = false;
        this.id = generateID();
    }
    equals(other) {
        if (typeof other === 'string' || other instanceof String) {
            return this.operation === other;
        }
        return other instanceof Operator && other.operation === this.operation
    }
    stringify() {
        return this.symbol;
    }
}


function getPaths(path) {
	let splitPath = path.replace(/,/g, ",items,").split(",");
	let parentPath = splitPath.slice(0, splitPath.length - 2);
	return [splitPath, parentPath];
}

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

    updateToken(token, path, constant, variable) {
        return produce(this, draft => {
            let [tokenPath, parentPath] = getPaths(path);
            let parent = Object.path(draft, parentPath);
            let dest = parent.items.find(o => o.id == token.id);
            dest.constant = constant
            dest.variable = variable;
        });
    }
}
