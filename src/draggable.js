function triggerEvent(el, type){
	if ('createEvent' in document) {
		 // modern browsers, IE9+
		 var e = document.createEvent('HTMLEvents');
		 e.initEvent(type, false, true);
		 el.dispatchEvent(e);
	 } else {
		 // IE 8
		 var e = document.createEventObject();
		 e.eventType = type;
		 el.fireEvent('on'+e.eventType, e);
	 }
 }

export function draggable(node) {
	let x;
	let y;

	let offset;
	let entered = null;
	let touchIndex = 0;

	function handleMousedown(event) {
		if (event.button !== 0)
			return;
		x = event.clientX;
		y = event.clientY;
        offset = {x: x, y: y}
        

		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
		}));

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
		window.drag[touchIndex] = node;
		window.drop[touchIndex] = null;
	}

	function handleTouchDown(event) {
		if (!(event instanceof TouchEvent))
			return;
		touchIndex = event.touches.length - 1;
		x = event.touches[touchIndex].clientX;
		y = event.touches[touchIndex].clientY;
        offset = {x: x, y: y}
        

		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
		}));

		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleTouchEnd);
		window.drag[touchIndex] = node;
		window.drop[touchIndex] = null;
	}

	function handleTouchMove(event) {
		x = event.touches[touchIndex].clientX;
		y = event.touches[touchIndex].clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: x - offset.x, y: y - offset.y }
		}));

		var element = document.elementFromPoint(x, y);
		if (element !== entered) {
			if (entered) {
				triggerEvent(entered.parentNode, 'mouseleave');
			}
			entered = element;
			triggerEvent(element.parentNode, 'mouseenter');
		}
	}

	function handleMousemove(event) {
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
		}));
	}

	function handleTouchEnd(event) {
		let dropped = window.drop[touchIndex] && window.drop[touchIndex] !== node;

		if (dropped) {
			node.dispatchEvent(new CustomEvent('dropsend', {
				detail: { x: x - offset.x, y: y - offset.y }
			}));
		} else {
			node.dispatchEvent(new CustomEvent('dragend', {
				detail: { x: x - offset.x, y: y - offset.y }
			}));
		}
		if (entered) {
			if (window.drag[touchIndex] && window.drop[touchIndex]) {
				entered.parentNode.dispatchEvent(new CustomEvent('droprecieve', {
					detail: { x, y, drag: node, drop: window.drop[touchIndex] }
				}));
				triggerEvent(entered.parentNode, 'mouseleave');
			}
		}
		window.drag[touchIndex] = null;
		window.drop[touchIndex] = null;

		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleTouchEnd);

	}

	function handleMouseup(event) {
		x = event.clientX;
        y = event.clientY;
        // console.log({ x: x - offset.x, y: y - offset.y });
		let dropped = window.drop[touchIndex] && window.drop[touchIndex] !== node;

		if (dropped) {
			node.dispatchEvent(new CustomEvent('dropsend', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
			}));
		} else {
			node.dispatchEvent(new CustomEvent('dragend', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
			}));
		}
		window.drag[touchIndex] = null;
		window.drop[touchIndex] = null;

		window.removeEventListener('mousemove', handleMousemove);
		window.removeEventListener('mouseup', handleMouseup);
	}

	function handleMouseEnter(event) {
		x = event.clientX;
		y = event.clientY;
		
		if (window.drag[touchIndex] && window.drag[touchIndex] !== node) {
			// console.log("drag enter");
			window.drop[touchIndex] = node;
			node.dispatchEvent(new CustomEvent('dragenter', {
				detail: { x, y }
			}));
		} else {
			// console.log("mouse enter");
			node.dispatchEvent(new CustomEvent('dragmouseenter', {
				detail: { x, y }
			}));
		}
	}

	function handleMouseExit(event) {
		x = event.clientX;
		y = event.clientY;

		if (window.drag[touchIndex]) {
			// console.log("drag exit");
			node.dispatchEvent(new CustomEvent('dragexit', {
				detail: { x, y }
			}));
			window.drop[touchIndex] = null;
		} else {
			// console.log("mouse exit");
			node.dispatchEvent(new CustomEvent('dragmouseexit', {
				detail: { x, y }
			}));
		}
	}

	function handleDrop(event) {
		if (window.drag[touchIndex] && window.drop[touchIndex]) {
			node.dispatchEvent(new CustomEvent('droprecieve', {
				detail: { x, y, drag: window.drag[touchIndex], drop: window.drop[touchIndex] }
			}));
		}
	}

	node.addEventListener('touchstart', handleTouchDown);

	node.addEventListener('mousedown', handleMousedown);
	node.addEventListener('mouseup', handleDrop);
	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseExit);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchDown);
		
			node.removeEventListener('mousedown', handleMousedown);
			node.removeEventListener('mouseup', handleDrop);
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseExit);
		}
	};
}