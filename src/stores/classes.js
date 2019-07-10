import { immerable, produce } from 'immer'

function generateID() {
	return Math.random().toString(36).substr(2, 9);
}

export class Expression {
    constructor(items) {
        this[immerable] = true
        this.items = items;
        this.id = generateID();
        this.hint = false;
        this.error = false;
    }

    stringify() {
        return "(" + this.items.map(item => item.stringify()).join(" ") + ")";
    }
}

export class Token {
    constructor(constant, variable, editable=false) {
        this[immerable] = true
        this.constant = constant;
        this.variable = variable;
        this.editable = editable;
        this.id = generateID();
        this.hint = false;
        this.error = false;
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
        this.hint = false;
        this.error = false;
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

export function parseGrammar(exp) {
    // console.log(exp);
    switch(exp.operator) {
        case 'EQUAL':
            return new Equation(parseGrammar(exp.left), parseGrammar(exp.right));
        case 'CONST':
            return new Token(exp.value, null);
        case 'VAR':
            return new Token(1, exp.variable);
        case 'UMINUS':
            return new Token(-exp.base.value, null);
        case 'PLUS':
            return new Expression(exp.terms.reduce((res, item, i, src) => {
                    let token = parseGrammar(item);
                    let operator = item.sign > 0 ? new Operator('+', 'PLUS') : new Operator('-', 'MINUS')
                    return i > 0 ? res.concat(operator, token) : res.concat(token);
                }, []));
        case 'TIMES':
            console.log("TIMES");
            let divide = []
            let newExp = new Expression(exp.factors.reduce((res, item, i, src) => {
                let token = parseGrammar(item);
                if (item.exp > 0) {
                    if (divide.length > 0) {
                        res.splice(res.length - 1, 1, new Expression([
                            res[res.length - 1], 
                            new Operator('÷', 'DIVIDE'),
                            divide.length === 1 ? 
                                divide[0] :
                                combineConstVars(new Expression(
                                    divide.reduce((res, item, i) => i > 0 ? res.concat(new Operator('×', 'TIMES'), item) : res.concat(item), [])
                                ))
                        ]));
                        divide = [];
                    }
                    return i > 0 ? res.concat(new Operator('×', 'TIMES'), token) : res.concat(token);
                } else {
                    divide.push(token);
                    if (i === src.length - 1) {
                        return res.concat( 
                            new Operator('÷', 'DIVIDE'),
                            divide.length === 1 ? divide[0] : combineConstVars(new Expression(
                                divide.reduce((res, item, i) => i > 0 ? res.concat(new Operator('×', 'TIMES'), item) : res.concat(item), [])
                            )
                        ));
                    }
                    return res;
                }
            }, []));
            
            // console.log(newExp);
            
            return combineConstVars(newExp);
        default:
            return null;
    }
}

function combineConstVars(expression) {
    let items = expression.items.reduce((res, item, i, src) => {
        if (item instanceof Operator) {
            return res.concat(item);
        } else if (i > 1) {
            let prev = res[res.length - 2];
            let op = res[res.length - 1];
            if(item instanceof Token && prev instanceof Token && item.variable && !prev.variable && op.equals('TIMES')) {
                    res.splice(res.length - 2, 2, new Token(item.constant * prev.constant, item.variable || '' + prev.variable || ''));
                    return res;
            } else if (op.equals('DIVIDE')) {
                res.splice(res.length - 2, 2, new Expression([prev, op, item]))
                return res;
            } else {
                return res.concat(item);
            }
        } else {
            return res.concat(item);
        }
    }, []);
    if (items.length === 1) {
        return items[0];
    } else {
        expression.items = items;
        return expression;
    }
}