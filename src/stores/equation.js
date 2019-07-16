import { writable, get } from 'svelte/store';
import { Expression, Token, Operator, Equation } from './classes';
import { history } from './history.js';

// const initial = new Equation(
//     new Expression([new Token(1, null), 'DIVIDE', new Token(2, 'x')]),
//     new Expression([new Token(3, null)])
// )
const builder = new CTATTutoringServiceMessageBuilder ();
const parse = new CTATAlgebraParser()
let exp = parse.algParse("3x + 6 = 9");
// let exp = parse.algParse("2/3 * 5/4 = 9");
// let exp = parse.algParse("x+-2=6x + 5/?/3");
const initial = exp;//parseGrammar(exp)

history.push(initial);


Object.path = (o, p) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

let source;
let dest;

function createDraftEquation() {
	const { subscribe, set, update } = writable(initial);

	return {
        subscribe,
        moveItem: (srcData, destData) => update(eqn => {
            source = srcData;
            dest = destData;
            eqn = get(history).current;
            // console.log(srcData, destData);
            if (srcData.item !== destData.item) {
                if (srcData.item instanceof Token) {
                    if (destData.item instanceof Token) {
                        if (!destData.item.variable && !destData.item.constant) {
                            let src = parse.algParse(srcData.item.value())
                            let dest = Object.path(eqn, destData.item.path)
                            src.sign = dest.sign;
                            src.exp = dest.exp;
                            let next = parse.algReplaceExpression(eqn, dest, src);
                            return parse.algStringify(next) === parse.algStringify(eqn) ? eqn : next;
                        } else if (Object.path(eqn, srcData.item.path.slice(0, -2)) === Object.path(eqn, destData.item.path.slice(0, -2))) {
                            let parent = Object.path(eqn, srcData.item.path.slice(0, -2));
                            let n0 = srcData.item.path.slice(-1);
                            let n1 = destData.item.path.slice(-1);
                            let next = parse.algReplaceExpression(eqn, parent, parse.algApplyRulesSelectively(parent, ['combineSimilar'], false, n0, n1))
                            return parse.algStringify(next) === parse.algStringify(eqn) ? eqn : parse.algParse(parse.algStringify(next));
                        }
                    } else if (destData.item instanceof Expression) {
                        // console.log("Token -> Expression");
                        // console.log(Object.path(eqn, srcData.item.path.slice(0, -2)) === Object.path(eqn, destData.item.path.slice(0, -2)));
                        // console.log(Object.path(eqn, srcData.item.path.slice(0, -2)));
                        // console.log(srcData.item.path.slice(-1));
                        // console.log(destData.item.path.slice(-1));
                        
                        if (Object.path(eqn, srcData.item.path.slice(0, -2)) === Object.path(eqn, destData.item.path.slice(0, -2))) {
                            let parent = Object.path(eqn, srcData.item.path.slice(0, -2));
                            let n0 = srcData.item.path.slice(-1);
                            let n1 = destData.item.path.slice(-1);
                            let next = parse.algReplaceExpression(eqn, parent, parse.algApplyRulesSelectively(parent, ['distribute'], false, n0, n1))
                            console.log(next);
                            console.log(parse.algParse(next.toString()));
                            return parse.algStringify(next) === parse.algStringify(eqn) ? eqn : parse.algParse(parse.algStringify(next));
                        }
                    }
                } else if (srcData.item instanceof Operator) {
                    if (destData.item instanceof Token || destData.item instanceof Expression) {
                        let operation = srcData.item.operation
                        let dest = Object.path(eqn, destData.item.path)
                        let next = parse.algReplaceExpression(eqn, dest, parse.algCreateExpression(operation, dest, '?'));
                        return parse.algStringify(next) === parse.algStringify(eqn) ? eqn : next;
                    }
                }
            }
            return eqn;
        }),
        updateToken: (token, value) => update(eqn => {
            let newToken = parse.algParse(value);
            let oldToken = Object.path(eqn, token.path)
            newToken.sign = oldToken.sign;
            newToken.exp = oldToken.exp;
            return parse.algReplaceExpression(eqn, oldToken, newToken);
        }),
        set: next => set(next),
        reset: () => set(get(history).current),
        apply: (student=true) => update(eqn => {
            if (get(history).current !== eqn) {
                history.push(eqn);
                if (student) {
                    var sai = new CTATSAI('equation', 'UpdateTextField', eqn.toString());
                    if (CTATCommShell.commShell)
                        CTATCommShell.commShell.processComponentAction(sai);
                }
            }
            return eqn;
        })
	};
}
export const draftEquation = createDraftEquation();



function createDragData() {
	const { subscribe, set } = writable({});

	return {
        subscribe,
        reset: () => set({}),
        set: (item, path) => {
            return set({item: item, path: path})
        },
	};
}
export const dragData = createDragData();

function createDropData() {
	const { subscribe, set, update } = writable({});

	return {
        subscribe,
        reset: () => set({}),
        set: (item, path, drag) => {
            draftEquation.moveItem(drag, {item: item, path: path});
            return set({item: item, path: path})
        },
	};
}
export const dropData = createDropData();


function getPaths(path) {
    let splitPath = path.replace(/,/g, ",items,").split(",");
	let parentPath = splitPath.slice(0, splitPath.length - 2);
    // console.log(splitPath);
    // console.log(parentPath);
	return [splitPath, parentPath];
}

function sameOps(operator, parentOp) {
	if (parentOp.equals('PLUS') || parentOp.equals('MINUS')) {
		return operator.equals('PLUS') || operator.equals('MINUS');
	} else if (parentOp.equals('TIMES')) {
		return operator.equals('TIMES');
	}
}


export function parseGrammar(exp, path) {
    if (!path)
        path = [];
    switch(exp.operator) {
        case 'EQUAL':
            return new Equation(parseGrammar(exp.left, path.concat(['left'])), parseGrammar(exp.right, path.concat(['right'])));
        case 'CONST':
            return new Token(exp.value, null, path);
        case 'VAR':
            return new Token(1, exp.variable, path);
        case 'UMINUS':
            return new Token(-exp.base.value, null, path);
        case 'UNKNOWN':
            return new Token(null, null, path);
        case 'PLUS':
            return new Expression(exp.terms.reduce((res, item, i, src) => {
                let token = parseGrammar(item, path.concat(['terms', i]));
                let operator = item.sign > 0 ? new Operator('PLUS') : new Operator('MINUS')
                return i > 0 ? res.concat(operator, token) : res.concat(token);
            }, []), path);
        case 'TIMES':
            // console.log("TIMES");
            let divide = []
            let newExp = new Expression(exp.factors.reduce((res, item, i, src) => {
                let token = parseGrammar(item, path.concat(['factors', i]));
                if (item.exp < 0) {
                    divide.push(token);
                    return res;
                } else {
                    return i > 0 ? res.concat(new Operator('TIMES'), token) : res.concat(token);
                }
            }, []), path);
            if (divide.length > 0) {
                newExp = new Expression([
                    flatten(combineConstVars(newExp)),
                    new Operator('DIVIDE'),
                    flatten(combineConstVars(new Expression(divide.reduce((res, item, i) => {
                        return i > 0 ? res.concat(new Operator('TIMES'), item) : res.concat(item);
                    }, []))))
                ])
            }
            return flatten(combineConstVars(newExp, path));
        default:
            return null;
    }
}

function flatten(expression) {
    return expression.items.length === 1 ? expression.items[0] : expression;
}

function combineConstVars(expression, path) {
    let items = expression.items.reduce((res, item, i, src) => {
        if (item instanceof Operator) {
            return res.concat(item);
        } else if (i > 1) {
            let prev = res[res.length - 2];
            let op = res[res.length - 1];
            if(item instanceof Token && prev instanceof Token && item.variable && !prev.variable && op.equals('TIMES')) {
                    res.splice(res.length - 2, 2, new Token(
                        item.constant * prev.constant,
                        item.variable || '' + prev.variable || '',
                        path));
                    return res;
            } else if (op.equals('DIVIDE')) { //TODO figure out a ref for this
                res.splice(res.length - 2, 2, new Expression([prev, op, item], path))
                return res;
            } else {
                return res.concat(item);
            }
        } else {
            return res.concat(item);
        }
    }, []);
    expression.items = items;
    return expression;
}