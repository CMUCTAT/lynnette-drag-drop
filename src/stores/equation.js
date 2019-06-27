import produce from 'immer'

import { writable, get } from 'svelte/store';
import { Expression, Token, Operator, Equation } from './classes';
import { add, subtract, multiply, divide } from './operators.js';
import { history } from './history.js';

const initial = new Equation(
    new Expression([new Token(1, null), divide(), new Token(2, 'x')]),
    new Expression([new Token(3, null)])
)
history.push(initial);

Object.path = (o, p) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

function createDraftEquation() {
	const { subscribe, set, update } = writable(initial);

	return {
        subscribe,
        moveItem: (srcData, destData) => update(eqn => {
            eqn = get(history).current;
            // console.log(srcData, destData);
            if (srcData.item !== destData.item) {
                if (srcData.item instanceof Token) {
                    if (destData.item instanceof Token && destData.item.editable) {
                        // console.log("TOKEN -> TOKEN")
                        return tokenToToken(srcData, destData, eqn);
                    } else if (destData.item instanceof Operator) { }
                    else if (destData.item instanceof Expression) { }
                } else if (srcData.item instanceof Operator) {
                    if (destData.item instanceof Token) {
                        // console.log("OPERATOR -> TOKEN")
                        return operatorToToken(srcData, destData, eqn);
                    } else if (destData.item instanceof Operator) { }
                    else if (destData.item instanceof Expression) {
                        // console.log("OPERATOR -> EXPRESSION")
                        return operatorToExpression(srcData, destData, eqn);
                    }
                }
            }
            return eqn;
        }),
        reset: () => set(get(history).current),
        apply: () => update(eqn => {
            if (get(history).current !== eqn)
                history.push(eqn);
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
	return [splitPath, parentPath];
}

function sameOps(operator, parentOp) {
	if (parentOp.equals(add()) || parentOp.equals(subtract())) {
		return operator.equals(add()) || operator.equals(subtract());
	} else if (parentOp.equals(multiply())) {
		return operator.equals(multiply());
	}
}

function operatorToToken(operatorData, tokenData, eqn) {
    let next = produce(eqn, draft => {
        let [operatorSplitPath, operatorParentPath] = getPaths(operatorData.path);
        let [tokenSplitPath, tokenParentPath] = getPaths(tokenData.path);
        let operatorParent = Object.path(draft, operatorParentPath);
        let tokenParent = Object.path(draft, tokenParentPath);
        let operator = operatorData.item;
        let token = tokenParent.items.find(o => o.id == tokenData.item.id);
        if (tokenParent.items.length === 1) {
            tokenParent.items.push(new Operator(operator.symbol, operator.operation));
            tokenParent.items.push(new Token(null, null, true));
            return;
        }
        let index = tokenParent.items.indexOf(token);
        if (operator.equals(divide())) {
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
        if (operator.equals(divide())) {
            let newExp = new Expression(expression.items);
            expression.items = [newExp, new Operator(operator.symbol, operator.operation), new Token(null, null, true)];
        } else if (sameOps(operator, expression.items[1])) {
            expression.items.push(new Operator(operator.symbol, operator.operation));
            expression.items.push(new Token(null, null, true));
        } else {

            if (operator.equals(multiply())) {
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