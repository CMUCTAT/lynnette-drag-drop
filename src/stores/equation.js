import produce from 'immer'

import { writable, get } from 'svelte/store';
import { Expression, Token, Operator, Equation, parseGrammar } from './classes';
import { history } from './history.js';

// const initial = new Equation(
//     new Expression([new Token(1, null), 'DIVIDE', new Token(2, 'x')]),
//     new Expression([new Token(3, null)])
// )
const builder = new CTATTutoringServiceMessageBuilder ();
const parse = new CTATAlgebraParser()
let exp = parse.algParse("x + -2 = 5x * 7 / (6x)");
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
                    if (destData.item instanceof Token && !destData.item.constant) {
                        // console.log("TOKEN -> TOKEN")
                        if (!destData.variable && !destData.constant) {
                            // console.log(parse.algReplaceExpression(eqn, destData.item.ref, srcData.item.ref));
                            return parse.algReplaceExpression(eqn, destData.item.ref, srcData.item.ref);
                        }
                        return tokenToToken(srcData, destData, eqn);
                    } else if (destData.item instanceof Operator) { }
                    else if (destData.item instanceof Expression) { }
                } else if (srcData.item instanceof Operator) {
                    if (destData.item instanceof Token) {
                        // console.log("OPERATOR -> TOKEN")
                        let next = parse.algReplaceExpression(eqn, destData.item.ref, parse.algCreateExpression(srcData.item.operation, destData.item.ref, '?'));
                        console.log(destData.item.ref, next);
                        
                        return next;
                    } else if (destData.item instanceof Operator) { }
                    else if (destData.item instanceof Expression) {
                        // console.log("OPERATOR -> EXPRESSION")
                        return parse.algReplaceExpression(eqn, destData.item.ref, parse.algCreateExpression(srcData.item.operation, destData.item.ref, '?'));
                    }
                }
            }
            return eqn;
        }),
        set: next => set(next),
        reset: () => set(get(history).current),
        apply: (student=true) => update(eqn => {
            if (get(history).current !== eqn) {
                history.push(eqn);
                console.log(student);
                
                if (student) {
                    var sai = new CTATSAI('equation', 'UpdateTextField', eqn.toString());
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

function operatorToToken(operatorData, tokenData, eqn) {
    let next = produce(eqn, draft => {
        let [operatorSplitPath, operatorParentPath] = getPaths(operatorData.path);
        let [tokenSplitPath, tokenParentPath] = getPaths(tokenData.path);
        let operatorParent = Object.path(draft, operatorParentPath);
        let operator = operatorData.item;
        let tokenParent;
        let token;
        if (tokenParentPath.length === 0) {
            token = draft[tokenSplitPath[0]];
            draft[tokenSplitPath[0]] = new Expression([token]);
            tokenParent = draft[tokenSplitPath[0]];
        } else {
            tokenParent = Object.path(draft, tokenParentPath);
            token = tokenParent.items.find(o => o.id == tokenData.item.id);
        }
        if (tokenParent.items.length === 1) {
            tokenParent.items.push(new Operator(operator.symbol, operator.operation));
            tokenParent.items.push(new Token(null, null, true));
            return;
        }
        let index = tokenParent.items.indexOf(token);
        if (operator.equals('DIVIDE')) {
            tokenParent.items.splice(index, 1, new Expression([token, new Operator(operator.symbol, operator.operation), new Token(null, null, true)]));
        } else if (sameOps(operator, tokenParent.items[1])) {
            tokenParent.items.splice(index + 1, 0, new Operator(operator.symbol, operator.operation));
            tokenParent.items.splice(index + 2, 0, new Token(null, null, true));
        } else {
            tokenParent.items.splice(index, 1, new Expression([token, new Operator(operator.symbol, operator.operation), new Token(null, null, true)]));
        }
    });
    return next;
}

function operatorToExpression(operatorData, expressionData, eqn) {
    return produce(eqn, draft => {
        let [operatorSplitPath, operatorParentPath] = getPaths(operatorData.path);
        let [expressionSplitPath, expressionParentPath] = getPaths(expressionData.path);
        let operatorParent = Object.path(draft, operatorParentPath);
        let operator = operatorData.item;
        let expression = Object.path(draft, expressionSplitPath);
        if (expression.items.length === 1) {
            expression.items.push(new Operator(operator.symbol, operator.operation));
            expression.items.push(new Token(null, null, true));
            return;
        }
        if (operator.equals('DIVIDE')) {
            let newExp = new Expression(expression.items);
            expression.items = [newExp, new Operator(operator.symbol, operator.operation), new Token(null, null, true)];
        } else if (sameOps(operator, expression.items[1])) {
            expression.items.push(new Operator(operator.symbol, operator.operation));
            expression.items.push(new Token(null, null, true));
        } else {

            if (operator.equals('TIMES')) {
                let newExp = new Expression(expression.items);
                expression.items = [new Token(null, null, true), new Operator(operator.symbol, operator.operation), newExp];
            } else {
            let newExp = new Expression(expression.items);
            expression.items = [newExp, new Operator(operator.symbol, operator.operation), new Token(null, null, true)];
            }
        }
    });
}

function tokenToToken(srcToken, destToken, eqn) {
    return produce(eqn, draft => {
        let [srcSplitPath, srcParentPath] = getPaths(srcToken.path);
        let [destSplitPath, destParentPath] = getPaths(destToken.path);
        let srcParent = Object.path(draft, srcParentPath);
        let destParent = Object.path(draft, destParentPath);
        let src = srcParent.items.find(o => o.id == srcToken.item.id);
        let dest = destParent.items.find(o => o.id == destToken.item.id);
        if (src.editable && !dest.editable ) {
            if (srcParent !== destParent) // TODO display error
                return;
            let srcOperator = srcParent.items[srcParent.items.indexOf(src) - 1];
            let destOperator = destParent.items[destParent.items.indexOf(dest) - 1];
            let operation = srcParent.items[srcParent.items.indexOf(src) + 1];            
        } else {
            dest.constant = src.constant;
            dest.variable = src.variable;
        }
    });
}