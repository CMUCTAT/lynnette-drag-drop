window.msgTranslator = (function() {
	var msgMap = {
		"You have <termType> on both sides.  How can you have all <termType> on the <side1> and none on the <side2>?": "Tienes <termType> en ambos lados. Cómo puedes hacer para tener todas las <termType> del lado <side1> y ninguna en el lado <side2>?",
		"How can you get rid of <term> on the <side>?": "¿Cómo puedes eliminar <term> en el lado <side>?",
		"Add <term> to both sides.": "Suma <term> en ambos lados.",
		"Subtract <term> from both sides.": "Resta <term> de ambos lados.",
		"Drag the <sign> onto the <side> side.": "Arrastra el signo <operation> hacia el lado <side>.",
		"Enter <term> on the <side> side." : "Ingresa <term> en el lado <side>.",
		"Enter <term>.": "Ingresa <term>.",
		"You have a variable with a coefficient on the <side> side.  You can get the variable by itself by dividing both sides by the coefficient.": "Tienes una variable con un coeficiente en el lado <side>. Puedes obtener la variable sola dividiendo ambos lados por el coeficiente.",
		"Divide both sides by the coefficient of x, which is <term>": "Divide ambos lados para el coeficiente de x, que es <term>",
		"Drag the division sign onto the <side> side.": "Arrastra el signo de división al lado <side>",
		"Multiply both sides by -1": "Multiplica ambos lados por -1",
		"Drag the times sign onto the <side> side." : "Arrastra el signo de multiplicación al lado <side>",
		"You have a product term on the <side> side.  You can divide both sides by one of its factors.": "Tienes un término de la multiplicación en el lado <side>. Puedes dividir ambos lados para uno de sus factores.",
		"Divide both sides by <term>": "Divide ambos lados para <term>",
		"You have a division term on the <side> side.  You can multiply both sides by its denominator.": "Tienes un término de la división en el lado <side>. Puedes multiplicar ambos lados por su denominador",
		"Multiply both sides by <term>" : "Multiplica ambos lados por <term>",
		"Drag the times sign onto the <side> side.": "Arrastra el signo de multiplicación al lado <side>",
		"You need to fully simplify the expression before you can begin a new transformation": "Necesitas simplificar completamente la expresión antes de empezar una nueva transformación.",
		"Yes, that is correct, but you are skipping too many steps. Can you go step-by-step?": "Eso es correcto! pero estás saltándote muchos pasos. Puedes mostrar tu trabajo paso a paso?",
		"You need to drag the <sign> to the other side of the equation before choosing what to <operation_imp>" : "Antes de elegir un operando, necesitas aplicar el operador al otro lado de la ecuación.",
		"First you need to add <term> to the other side.": "Primero necesitas sumar <term> al otro lado de la ecuación.",
		"First you need to subtract <term> from the other side.": "Primero necesitas restar <term> del otro lado de la ecuación.",
		"First you need to divide the other side by <term>": "Primero, necesitas dividir el otro lado para <term>",
		"First you need to multiply the other side by <term>": "Primero, necesitas multiplicar el otro lado por <term>",
		"You subtracted <term> from the <side1>, now do the same on the <side2>.": "Restaste <term> del lado <side1>, ahora haz lo mismo en el lado <side2>.",
		"You added <term> to the <side1>, now do the same on the <side2>.": "Sumaste <term> al lado <side1>, ahora haz lo mismo en el lado <side2>.",
		"You divided the <side1> by <term>, now do the same on the <side2>.": "Dividiste el lado <side1> para <term>, ahora haz lo mismo en el lado <side2>.",
		"Now drag the <sign> onto the other side of the equation": "Ahora arrastra el mismo operador al otro lado de la ecuación",
		"Drag the <sign> onto the <side> side.": "Arrastra el <sign> al lado <side>.",
		"Now fill in the blank boxes with the term you want to <operation_imp>": "Ahora completa los recuadros blancos con el término que quieres <operation_imp>",
		"Enter <term> in the blank box on the left side of the equation.": "Escribe <term> en el recuadro blanco del lado izquierdo de la ecuación",
		"Now fill in the same thing on the other side of the equation.": "Ahora completa con el mismo operando en el otro lado de la ecuación",
		"Enter <term> in the blank box.": "Escribe <term> en el recuadro blanco.",
		"You've determined the value of x, so the problem is done.  Click \"Finish Problem\" to move on": "Haz encontrado el valor de x! El problema está resuelto. Haz click en \"Finalizar Problema\" para continuar.",
		"You can simplify the <side> side by distributing the multiplication": "Puedes simplificar el lado <side> distribuyendo la multiplicación.",
		"Multiply each of the terms in the expression <term> by <term2>": "Multiplica cada uno de los términos en la expresión <term> por <term2>",
		"Drag <term> over <term2>": "Arrastra <term> sobre <term2>",
		"Enter <term> on the <side> side": "Escribe <term> en el lado <side>",
		"You have to distribute the division term on the <side> in order to simplify it": "Distribuye el término de la división en el lado <side> para poder simplificarlo.",
		"Divide each of the terms in the numerator (<term>) by the denominator (<term2>)": "Divide cada uno de los términos en el numerador (<term>) por el denominador (<term>)",
		"Drag <term> over the expression in the numerator.": "Arrastra <term> sobre la expresión en el numerador.",
		"You can cancel terms in the division term on the <side> side.": "Puedes anular términos en la división del lado <side>",
		"The <term> in the denominator cancels out the <term> in the numerator, so you can remove those terms from the expression.": "El <term> en el denominador anula el <term> en el numerador, puedes eliminar esos términos de la expresión",
		"Drag the <term> in the denominator over the same term in the numerator.": "Arrastra <term> que se encuentra en el denominador sobre el mismo término que se encuentra en el numerador.",
		"You can simplify the <side> side by multiplying two terms together.": "Puedes simplicar el lado <side> al multiplicar dos términos.",
		"Drag <term> over <term2> to multiply them.": "Arrastra <term> sobre <term2> para multiplicar ambos factores.",
		"Now simplify the <termType> term on the <side> side.": "Ahora, simplifica <termType> en el lado <side>",
		"What does <term> evaluate to?": "Que evalúa <term>?",
		"Drag the denominator of <term> over the numerator.": "Arrastra el denominador de <term> sobre el numerador",
		"You have two <termType> terms on the <side> side that you can add together": "Tienes dos <termType> en el lado <side> que puedes sumar.",
		"On the <side> side, combine like terms by adding <term> and <term2>.": "En el lado <side>, combina términos similares sumando <term> y <term2>",
		"Drag <term> onto <term2>": "Arrastra <term> sobre <term2>.",
		"On the <side> side, you have the terms <term> and <term2>. These terms cancel each other out.": "Tienes los términos <term> y <term2> en el lado <side>. Estos términos se anulan entre sí.",
		"You can remove the terms <term> and <term2> from the <side> side.": "Puedes eliminar los términos <term> y <term2> del lado <side>.",
		"right": "derecha",
		"left": "izquierda",
		"multiplication": "multiplicación",
		"division": "división",
		"addition": "adición",
		"subtraction": "sustracción",
		"plus sign": "signo de adición",
		"minus sign": "signo de sustracción",
		"division sign": "signo de división",
		"times sign": "signo de multiplicación",
		"add": "sumar",
		"subtract": "restar",
		"multiply by": "multiplicar",
		"divide by": "dividir"
	};
	var translator = {};
	translator.toSpanish = function(eng) {
		return msgMap[eng] || eng;
	};
	
	translator.fillBlanks = function(msg, blankVals, translateBlanks) {
		if (blankVals) {
			for (let blankName in blankVals) {
				let rgx = new RegExp(blankName, 'g');
				let fillWith = translateBlanks ? translator.toSpanish(blankVals[blankName]) : blankVals[blankName];
				msg = msg.replace(rgx, fillWith);
			}
		}
		return msg;
	};
	
	return translator;
})();