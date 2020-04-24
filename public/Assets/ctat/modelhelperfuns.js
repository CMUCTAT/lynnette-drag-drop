
function setGivenDiagrams() {
	console.log(arguments);
}

function setSubtractionDiagrams() {
	console.log(arguments);
}

function setDivisionDiagrams() {
	console.log(arguments);
}


function getTermsAsStrings(side) {
	var sideExpr = getFacts("Expr").filter((e) => e.topLevel && e.side === side);
	var termStrs = sideExpr[0].terms.map((term) => termStr(term));
	return termStrs;
}

var genDiagramTPA = (function() {
	var opToFunctionMap = {
		'subtraction': 'setSubtractionDiagrams',
		'division-simple': 'setDivisionDiagrams',
		'division-complex': 'setDivisionDiagrams'
	};
	return function (transformationList) {
		console.log("genDiagramTPA for ")
		var transformation = transformationList[0]; //only cover one right now
		console.log(transformation);
		var functionName = opToFunctionMap[transformation.operation];
			simpExpAfter = CTATAlgebraParser.theParser.algSimplify(transformation.expAfter),
			argStr = simpExpAfter.replace("=", ',')+','+transformation.operand;
		console.log(functionName);
		return ['_root', functionName, argStr];
	}
})();

/*
str repr of simpleTerm
*/
function simpleTermStr(t, spaceAfterNeg) {
	spaceAfterNeg = true;
	var result = "";
	if ( t.coeff === -1){
		result += "-";
		result += (spaceAfterNeg ? ' ' : '')+(t.var ? '' : '1');
	}
	else if ( t.coeff !== 1 || !t.var ) {    // write 1x as x
		if (t.coeff < 0) {
			result += '-'+(spaceAfterNeg ? ' ' : '');
		}
		result += Math.abs(t.coeff);
	}
	if ( t.var !== null ) {
		result += t.var;
	}
	return result;
}

/*
str repr of divTerm
*/
function divTermStr(t) {
	var result = "";
	var top = t.factors[0];
	var topStr = eqStr(top.terms);
	var bottom = t.factors[1];
	var bottomStr = eqStr(bottom.terms);
	var result = ("(" + topStr + ")/(" + bottomStr + ")");
	return result;
}

/*
str repr of productTerm
*/
function productTermStr(t){
	var result = "";
	var factorExpr1 = t.factors[0];
	var Str1 = eqStr(factorExpr1.terms);
	var factorExpr2 = t.factors[1];
	var Str2 = eqStr(factorExpr2.terms);
	if(factorExpr1.terms.length > 1){
		result += ("(" + Str1 + ")");
	}else{
		result += Str1;
	}
	result += " * ";
	if(factorExpr2.terms.length > 1){
		result += ("(" + Str2 + ")");
	}else{
		result += Str2;
	}
	return result;
}

function unknownTermStr(t, fillInCouldBe) {
	return fillInCouldBe ? simpleTermStr(t.couldBe) : "?";
}

/*
str repr of a term
*/
function termStr(t, fillInUnknowns) {    // t is Nools object of type Term (or is it?)
	var result = "";
	switch(t.type) {
		case "simpleTerm":     // would like to test that it is a Term object, but ...
			return simpleTermStr(t);
		break;
		case "divTerm":
			return divTermStr(t);
		break;
		case "productTerm":
			return productTermStr(t);
		break;
		case "unknownTerm":
			return unknownTermStr(t, fillInUnknowns);
		break;
		default:
			return "";
	}
}

function eqStr(l, r, fillInUnknowns) {   // l and r are lists of terms - r may be undefined (if you want only one side)
//	console.log("+++eqStr", l, r);
	var result = "";
	var i;
	if (!(l instanceof Array) || l.length === 0) {
		return result;    // or error code?
	}
	// assumes simpleTerm - not always true
    //   once we deal with more complex equations - e.g.,  -3(x + 4)
    // better would be to look ahead to see if calling termStr on the next item
    // would yield something with a leading negative coefficient
    // and then move the negative sign from the term to the operator preceding it
    // (and perhaps "re-use" the result of calling termStr?)
	[l,r].forEach((side, idx)=>{
		if (side instanceof Array) {
			if (idx === 1) {
				result += '=';
			}
			var nextStr = termStr(side[0], fillInUnknowns);
			for (i = 0; i < side.length; i++) {
				result += nextStr;
				if(i < side.length - 1){
					nextStr = termStr(side[i+1], fillInUnknowns);
					if(nextStr.startsWith("-")){
						result += " ";
					}else{
						result += " + ";
					}
				}
			}
		}
	});

	return result;
}

function checkEqualEquation(input1, input2){
	return CTATAlgebraParser.theParser.algPartiallyEquivalent(input1, input2);
}

/*check if two strings are the same expression
*/
function SAIeq(sai1, sai2) {
//	console.log("+++saiEqual", sai1, sai2);
	if ( (sai1.selection === sai2.selection)
			&& (sai1.action === sai2.action)
			&& checkEqualEquation(sai1.input, sai2.input) ) {
		return true;
	}
	else {
		return false;
	}
}

/*
return the opposite side of side
*/
function oppositeSide(side) {
//	console.log("oppositeSide", side);
	if ( side === "left" )  {
		return "right";
	}
	else if ( side === "right" ) {
		return "left";
	}
	else  {
		return side;
	}
}

/*
set fact number
*/
var curFactNr  = 0;
function setFactNr(f) {
	f.factNr = curFactNr++;
}

function divisibleWhenCombined(terms,c){
	var sum = 0;
	var sumWithVar = 0;
	terms.forEach(function(term){
		if(term.type === "simpleTerm"){
			if(term.var !== null){
				sumWithVar += term.coeff;
			}else{
				sum += term.coeff;
			}
		}
	});
	return sum % c === 0 && sumWithVar %c ===0;
}

/*
check if every term in the expression is divisible by coeff
*/
function checkDivisible(expression,coeff,pt){
	for(var i=0;i<expression.terms.length;i++){
		var term = expression.terms[i];
		if(term.type === "Expr"){
			if(checkDivisible(term, coeff, pt)){
				continue;
			}else{
				return false;
			}
		}else if(term.type != "simpleTerm"){
			if(term.type === "productTerm" && term === pt){
				return true;
			}
			return false;
		}else if(term.coeff % coeff != 0){
			if(divisibleWhenCombined(expression.terms,coeff)){
				continue;
			}
			return false;
		}
	}
	return true;
}

/*
get the top level expression of side s
*/
function getTopLevelExpression(s){
	var expressions = getTwoSide();
	return expressions[0].side === s ? expressions[0] : expressions[1];
}

/*
* Debugging functions for printing the tree structure
* and the string representation
* of the equation in WM
*/
//helper functions for printing equation structure
function getTwoSide(){
	sides = [];
	let expressions = getFacts("Expr");
	//look for the top level expression
	expressions.forEach(function(expression){
		expression = expression;
		if(expression.topLevel && expression.side === "left"){
			sides.unshift(expression);
		}else{
			if(expression.topLevel && expression.side === "right"){
				sides.push(expression);
			}
		}
	});

	//an equation should have two sides
	if(sides.length!=2){
		console.log("cannot correctly retrieve the two sides of the equation");
	}

	return sides;
}

function printTerm(term,indent,last){
	var str = "";
	var repr = termStr(term);
	str += indent;
	if(last){
		str += "\\-  ";
	}else{
		str += "|-  ";
	}
	str += (term.type + ": ");
	str += repr;
	console.log(str);
}

function printExpressionTree(expression,indent,last,){
	var terms = expression.terms;
	var str = "";
	str += indent;
	if(last){
		str += "\\-  ";
		indent += "   ";
	}else{
		str += "|-  "
		indent += "|  ";
	}
	str += "Expression";
	console.log(str);
	for(var i=0;i < terms.length;i++){
		term = terms[i];
		if(term.type == "Expr"){
			printExpressionTree(term,indent,i==(terms.length-1));
		}else{
			//console.log(term);
			printTerm(term,indent,i==(terms.length-1));
		}
	}
}

//print the equation tree
function showEquationTree(){
	console.log("Expression Tree:");

	var sides = getTwoSide();
	var leftExpression = sides[0];
	var rightExpression = sides[1];
	console.log("left side:");
	printExpressionTree(leftExpression,"",true);
	console.log("right side:");
	printExpressionTree(rightExpression,"",true);
}

//helper function for getting the string repr of a expression
function getExpressionString(expression){
	var repr = "";
	var terms = expression.terms;
	//console.log("terms:");
	//console.log(terms)
	terms.forEach(function(term){
		var termRepr = "";
		if(term.type == "Expr"){
			termRepr = "(" + getExpressionString(term) + ")" + " + ";
		}else{
			termRepr = "(" + termStr(term) + ")" + " + "; 
		}
		repr += termRepr;
	});
	repr = repr.substring(0,repr.length-2);
	return repr;
}

//print equation as a single string
function printEquation(){
	console.log("Equation String Repr:");
	var sides = getTwoSide();
	var left = getExpressionString(sides[0]);
	var right = getExpressionString(sides[1]);
	console.log(left + " = " + right);
}

//print equation as a single string
function getEquationString(){
	var sides = getTwoSide();
	var left = getExpressionString(sides[0]);
	var right = getExpressionString(sides[1]);
	return left + " = " + right;
}

/*
* parsing problem string to initialize working memory
*
*/
function simpleTerm(c, v, s) {   	
   	this.coeff = c;
   	this.var = v;
   	this.side = s;

    this.type = "simpleTerm";
    this.hasReference = false;
}

function Expr(s, t, top) {
	this.side = s;
	this.terms = t;
	this.topLevel = top;

	this.type = "Expr";
	this.hasReference = true;
}

function divTerm(f, s) {
	this.factors = f;
	this.side = s;

	this.type = "divTerm";
	this.hasReference = true;
}

function productTerm(f,s){
	this.factors = f;
	this.side = s;

	this.type = "productTerm";
	this.hasReference = true;

}


function getFactsFromNode(facts,node,side,topLevel){
	console.log("getFactsFromNode, side is "+side+", topLevel is "+topLevel+", node is ");
	console.log(node);
	if(topLevel && node.operator !== "PLUS"){
		var terms = [];
		var idx = getFactsFromNode(facts,node,side,false);
		terms.push(idx);
		var newExpr = new Expr(side,terms,topLevel);
		facts.push(newExpr);
		return;
	}
	switch(node.operator){
		case "VAR" :
			var newVariable = new simpleTerm(node.sign, node.variable, side);
			facts.push(newVariable);
			return (facts.length - 1);
			break;
		case "CONST" :
			var newConstant = new simpleTerm(node.value * node.sign, null, side);
			facts.push(newConstant);
			return (facts.length - 1);
			break;
		case "UMINUS" :
			var baseNode = node.base;
			//check if this is a simpleTerm or a productTerm
			if(baseNode.operator === "VAR"){
				var newVariable = new simpleTerm(-1, baseNode.variable, side);
				facts.push(newVariable);
				return (facts.length - 1);
			}else if(baseNode.operator === "CONST"){
				//this is a simpleTerm
				var newConstant = new simpleTerm((-1) * baseNode.value * baseNode.sign, null, side);
				facts.push(newConstant);
				return (facts.length - 1);
			}else{
				//this is a productTerm
				console.log("productTerm");
			}
			break;
		case "PLUS" : 
			//new Expression
			var terms = [];
			node.terms.forEach(function(subNode){
				var idx = getFactsFromNode(facts,subNode,side,false);
				terms.push(idx);
			});
			var newExpr = new Expr(side,terms,topLevel);
			facts.push(newExpr);
			return (facts.length - 1);
			break;
		case "TIMES" :
			//check if this is a simpleTerm or a productTerm
			if(node.factors.length == 2 
				&& ((node.factors[0].operator === "VAR" && node.factors[1].operator === "CONST")
					||(node.factors[1].operator === "VAR" && node.factors[0].operator === "CONST"))){
				//This is a simpleTerm :  4x
				var f1 = node.factors[0];
				var f2 = node.factors[1];
				var variable;
				var coeff;
				if(f1.operator === "VAR"){
					variable = f1.variable;
					coeff = f2.value * f2.sign * node.sign;
				}else{
					variable = f2.variable;
					coeff = f1.value * f1.sign * node.sign;
				}
				var newSimpleTerm = new simpleTerm(coeff, variable, side);
				facts.push(newSimpleTerm);
				return (facts.length - 1);
			}else if( (node.factors.length == 2) 
				&& (node.factors[0].operator === "UMINUS")
				&& (node.factors[1].operator === "VAR") 
				&& (node.factors[0].base.operator === "CONST")){
				//This is a simpleTerm :  -3x
				var f0 = node.factors[0];
				var f1 = node.factors[1];
				var variable = f1.variable;
				var	coeff = f0.base.value * (-1);
				var newSimpleTerm = new simpleTerm(coeff, variable, side);
				facts.push(newSimpleTerm);
				return (facts.length - 1);

			}else{
				//This is a productTerm
				factors = [];
				node.factors.forEach(function(subNode){
					var idx = getFactsFromNode(facts,subNode,side,false);
					if(facts[idx].type != "Expr"){
						//create an expression
						var terms = [idx];
						var newExpr = new Expr(side,terms,topLevel);
						facts.push(newExpr);
						factors.push(facts.length - 1);
					}else{
						factors.push(idx);
					}
				});
				var newProductTerm = new productTerm(factors,side);
				facts.push(newProductTerm);
				return (facts.length - 1);
			}
			break;
		case "EQUAL" :
			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
			console.log("!!!!!!!!!!!wrong input!!!!!!!!!!!");
			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
			break;
		default :
			return;
	}
}


function getAllFacts(initLeft, initRight){
	var parser = new CTATAlgebraParser();
	var leftNode = parser.algParse(initLeft);
	var rightNode = parser.algParse(initRight);
	var facts = [];
	getFactsFromNode(facts,leftNode,"left",true);
	getFactsFromNode(facts,rightNode,"right",true);
	return facts;
}

/*
put all the terms in expression e to terms list
*/
function getAllTerms(e, terms){
	switch(e.type){
		case "Expr":
			e.terms.forEach(function(t){
				getAllTerms(t,terms);
			});
			terms.push(e);
			break;
		case "simpleTerm":
			terms.push(e);
			break;
		case "divTerm":
			e.factors.forEach(function(f){
				getAllTerms(f,terms);
			});
			terms.push(e);
			break;
		case "productTerm":
			e.factors.forEach(function(f){
				getAllTerms(f,terms);
			});
			terms.push(e);
			break;
		default :
			console.log("other type");
	}
}

var possibleInputs = {
	"left": {},
	"right": {},
	"full": {}
};
var writeInputs = [];

function clearInputHistory() {
	possibleInputs = {
		"left": {},
		"right": {},
		"full": {}
	};
	writeInputs = [];
}

function inputRepeated(input, side){
	let ret = possibleInputs[side][input];
	return ret;
}

function recordInput(input, side){
	possibleInputs[side][input] = true;
}

function writeInput(input){
	writeInputs.push(input);
}

function getRepeatedInput(){
	var count = 0;
	for(var i = 0; i < writeInputs.length; i++){
		for(var j = 0; j < writeInputs.length; j++){
			if(i >= j){
				continue;
			}
			var input_i = writeInputs[i];
			var input_j = writeInputs[j];
			if(input_i === input_j){
				console.log("!!!!!!!!!!!!!!!!Repeated input!!!!!!!!!!!!!!!");
				console.log("i: ",i,"input: ",input_i);
				console.log("j: ",j,"input: ",input_j);
				count++;
			}
		}
	}
	console.log("total number of search: ",writeInputs.length);
	console.log("total number of repeated search: ",count);
}

/*
function testShowEquationTree(){
	var term1 = new simpleTerm(3,"x","left",0);
	var term2 = new simpleTerm(4,"y","left",1);
	var expression1 = new Expr("left",[term1,term2],false);
	var term3 = new simpleTerm(2,"m","left",0);
	var term4 = new simpleTerm(7,"n","left",2);
	var left = new Expr("left",[term3,expression1,term4],true);
	printExpressionTree(left,"",true);
	console.log("As String:");
	console.log(getExpressionString(left));
}
*/

function getTermFromNum(num){
	console.log(num);
	allTerms = getFacts("Expr");
	allTerms = allTerms.concat(getFacts("simpleTerm"));
	allTerms = allTerms.concat(getFacts("divTerm"));
	allTerms = allTerms.concat(getFacts("productTerm"));
	for(i = 0; i < allTerms.length;i++){
		term = allTerms[i];
		if(term.factNr == num){
			return term;
		}
	}
}

function done(terms){
	term1 = terms[0];
	term2 = terms[1];
	if(term1.var === null && term2.coeff === 1 && term1.var != term2.var){
		return true;
	}
	if(term2.var === null && term1.coeff === 1 && term1.var != term2.var){
		return true;
	}
	return false;

}

function getHintMessage(){
	if(getFacts("productTerm").length > 0){
		return "try distribute the productTerm";
	}
	if(getFacts("divTerm").length > 0){
		return "try simplify the division";
	}
	if(getFacts("simpleTerm").length == 2){
		if(done(getFacts("simpleTerm"))){
			return "you are done with the problem.";
		}
		return "try divide by the factor of x";
	}
	if(getFacts("simpleTerm").length > 0){
		return "try moving like terms together";
	}
	return "";
}

function finishedLastTransformation(){
	var transformations = getFacts("transformation");
	return ( transformations.length <= 1);
}

function __isConst(term) {
	if (term.hasOwnProperty("var")) {
		return !term["var"];
	} else {
		return term.factors.every((factor) => factor.terms.every(__isConst));
	}
}

function __hasDivTerm(exp) {
	let terms = exp.terms;
	for (let i = 0; i < terms.length; i++) {
		let term = terms[i];
		switch(term.type) {
			case "divTerm":
				return true;
				break;
			case "productTerm":
				let termFactors = term.factors, found = false, j = 0;
				while (j < termFactors.length && !found) {
					found = __hasDivTerm(termFactors[j++]);
				}
				if (found) {
					return true;
				}
				break;
			case "simpleTerm":
			break;
		}
	}
}