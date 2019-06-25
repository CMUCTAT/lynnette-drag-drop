import { Operator } from './classes';

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