import { writable, get } from 'svelte/store';
import { Expression, Token, Operator, Equation } from './classes';
import { history } from './history.js';

// const initial = new Equation(
//     new Expression([new Token(1, null), 'DIVIDE', new Token(2, 'x')]),
//     new Expression([new Token(3, null)])
// )
const builder = new CTATTutoringServiceMessageBuilder ();
const parse = new CTATAlgebraParser()
// let exp = parse.algParse("3x + 6 = 9");
let exp = parse.algParse("3x / ? = 3");
// let exp = parse.algParse("2/3 * 5/4 = 9");
// let exp = parse.algParse("x+-2=6x + 5/?/3");
const initial = exp

history.push(initial);


Object.path = (o, p) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

let dragOperation = {
    side: null,
    from: null,
    to: null
}

function createDraftEquation() {
	const { subscribe, set, update } = writable(initial);
    const apply = (student=true) => update(eqn => {
        if (student) {
            var sai = new CTATSAI(dragOperation.side, dragOperation.from + "To" + dragOperation.to, parse.algStringify(eqn));
            if (CTATCommShell.commShell)
                CTATCommShell.commShell.processComponentAction(sai);
        }
        
        if (get(history).current !== eqn) {
            history.push(eqn);
        }
        return eqn;
    });
	return {
        subscribe,
        moveItem: (srcData, destData) => update(eqn => {
            eqn = get(history).current;
            dragOperation.side = destData.item.path[0];
            
            if (srcData.item !== destData.item) {
                if (srcData.item instanceof Token) {
                    dragOperation.from = "Token";
                    if (destData.item instanceof Token) {
                        dragOperation.to = "Token";
                        let srcParent = Object.path(eqn, srcData.item.path.slice(0, -2));
                        let destParent = Object.path(eqn, destData.item.path.slice(0, -2));
                        if (!destData.item.variable && !destData.item.constant) {
                            
                            let src = parse.algParse(srcData.item.value())
                            let dest = Object.path(eqn, destData.item.path)
                            src.sign = dest.sign;
                            src.exp = dest.exp;
                            let next = parse.algReplaceExpression(eqn, dest, src);
                            return next;
                        } else if (srcParent === destParent) {
                            let parent = srcParent;
                            let indices = srcData.item.indices.concat(destData.item.indices);
                            let next = parse.algReplaceExpression(eqn, parent, parse.algApplyRulesSelectively(parent, ['combineSimilar'], false, ...indices))
                            parent = Object.path(next, srcData.item.path.slice(0, -2));
                            next = parse.algReplaceExpression(next, parent, parse.algApplyRules(parent, ['removeIdentity']))
                            return next;
                        }
                    } else if (destData.item instanceof Expression) {
                        dragOperation.to = "Expression";
                        let srcParent = Object.path(eqn, srcData.item.path.slice(0, -2));
                        let destParent = Object.path(eqn, destData.item.path.slice(0, -2));
                        console.log(srcParent.operator);
                        
                        if (srcParent === destParent && srcParent.operator !== 'EQUAL') {
                            let parent = Object.path(eqn, srcData.item.path.slice(0, -2));
                            let n0 = srcData.item.path.slice(-1)[0];
                            let n1 = destData.item.path.slice(-1)[0];
                            
                            let next = parse.algReplaceExpression(eqn, parent, parse.algApplyRulesSelectively(parent, ['distribute', 'removeIdentity'], false, n0, n1));
                            return next;
                        }
                    }
                } else if (srcData.item instanceof Operator) {
                    dragOperation.from = "Operator";
                    if (destData.item instanceof Token || destData.item instanceof Expression) {
                        dragOperation.to = destData.item instanceof Token ? "Token" : "Expression";
                        let operation = srcData.item.operation;
                        let dest = Object.path(eqn, destData.item.path)
                        let next = parse.algReplaceExpression(eqn, dest, parse.algCreateExpression(operation, dest, '?'));
                        return next;
                    }
                }
            }
            return eqn;
        }),
        updateToken: (token, value) => {
            update(eqn => {
                eqn = parse.algParse(get(history).current);
                let e = parse.algParse(eqn)
                let newToken = parse.algParse(value);
                let oldToken = Object.path(e, token.path)
                // parse.algFindExpression(e, oldToken);
                newToken.sign = oldToken.sign;
                newToken.exp = oldToken.exp;
                dragOperation.side = token.path[0];
                dragOperation.from = "Update";
                dragOperation.to = "Token";
    
                let next = parse.algReplaceExpression(e, oldToken, newToken)
                return next;
            });
            apply();
        },
        set: next => set(next),
        reset: () => set(get(history).current),
        apply
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

export function parseGrammar(exp) {
    
    let test = parseGrammarTree(exp, [])
    
    return test
}


function parseGrammarTree(exp) {
    console.log(exp);
    
    let path = exp.path.join(',').split(',');
    switch(exp.operator) {
        case 'EQUAL':
            let operands = parse.algGetOperands(exp)
            return new Equation(parseGrammarTree(operands[0]), parseGrammarTree(operands[1]));
        case 'CONST':
            return new Token(exp.value, null, path, path.slice(-1)[0]);
        case 'VAR':
            return new Token(1, exp.variable, path, );
        case 'UMINUS':
            return new Token(-exp.base.value, null, path, path.slice(-1)[0]);
        case 'UNKNOWN':
            return new Token(null, null, path, path.slice(-1)[0]);
        case 'PLUS':
            return new Expression(exp.terms.reduce((res, item, i, src) => {
                let token = parseGrammarTree(item);
                let operator = item.sign > 0 ? new Operator('PLUS') : new Operator('MINUS')
                return i > 0 ? res.concat(operator, token) : res.concat(token);
            }, []), path);
        case 'TIMES':
            let divide = []
            let newExp = new Expression(exp.factors.reduce((res, item, i, src) => {
                let token = parseGrammarTree(item);
                if (item.exp < 0) {
                    divide.push(token);
                    return res;
                } else {
                    return i > 0 ? res.concat(new Operator('TIMES'), token) : res.concat(token);
                }
            }, []), path);
            if (divide.length > 0) {
                newExp = new Expression([
                    flatten(combineConstVars(newExp, path)),
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
                    item.path, item.path.slice(-1)[0], prev.path.slice(-1)[0]));
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