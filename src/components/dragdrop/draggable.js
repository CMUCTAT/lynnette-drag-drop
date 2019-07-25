export function draggable(node, params) {
	let x;
	let y;

	let {type: type, accepts: accepts} = params
	

	let offset;
	let entered = null;
	let touchIndex = 0;

	function handleMousedown(event) {
        event.stopPropagation();
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
		window.drag[touchIndex] = {node: node, type: type};
		window.drop[touchIndex] = null;
	}

	

	function handleMousemove(event) {
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
		}));
	}

	

	function handleMouseup(event) {
        event.stopPropagation();
		x = event.clientX;
        y = event.clientY;
		let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;
		if (dropped) {
			node.dispatchEvent(new CustomEvent('dropsend', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y },
				bubbles: true
			}));
			window.drop[touchIndex].node.dispatchEvent(new CustomEvent('dropreceive', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y, drag: window.drag[touchIndex], drop: window.drop[touchIndex] },
				bubbles: true
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

		let index = event.detail && event.detail.index ? event.detail.index : 0;
		
		if (window.drag[index] && window.drag[index].node !== node) {
			// console.log("drag enter");
			window.drop[index] = {node: node, type: type};
			node.dispatchEvent(new CustomEvent('dragenter', {
				detail: { x, y },
				bubbles: true
			}));
		} else {
			// console.log("mouse enter");
			node.dispatchEvent(new CustomEvent('dragmouseenter', {
				detail: { x, y },
				bubbles: true
			}));
		}
	}

	function handleMouseExit(event) {
        event.stopPropagation();
		x = event.clientX;
		y = event.clientY;

		let index = event.detail && event.detail.index ? event.detail.index : 0;

		if (window.drag[index]) {
			// console.log("drag exit");
			node.dispatchEvent(new CustomEvent('dragexit', {
				detail: { x, y }
			}));
			window.drop[index] = null;
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

	function handleTouchDown(event) {
        event.stopPropagation();
		if (!(event instanceof TouchEvent))
			return;
		touchIndex = event.changedTouches[0].identifier;
		let curEvent = Object.values(event.touches).find(t => t.identifier === touchIndex);
		x = curEvent.clientX;
		y = curEvent.clientY;
        offset = {x: x, y: y}
        

		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: x - offset.x, y: y - offset.y }
		}));

		window.addEventListener('touchmove', handleTouchMove, {passive: true});
		window.drag[touchIndex] = {node: node, type: type};
		window.drop[touchIndex] = null;
	}

	function handleTouchMove(event) {
		let curEvent = Object.values(event.touches).find(t => t.identifier === touchIndex);
		x = curEvent.clientX;
		y = curEvent.clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: x - offset.x, y: y - offset.y }
		}));

		var element = document.elementFromPoint(x, y);
		if (!element)
			return;
		if (element !== entered) {
			if (entered) {
				entered.dispatchEvent(new CustomEvent('mouseleave', {
					detail: {index: touchIndex},
					bubbles: true
				}));
				entered.dispatchEvent(new CustomEvent('mouseout', {
					detail: {index: touchIndex},
					bubbles: true
				}));
			}
			entered = element;
			entered.dispatchEvent(new CustomEvent('mouseenter', {
				detail: {index: touchIndex},
				bubbles: true
			}));
			entered.dispatchEvent(new CustomEvent('mouseover', {
				detail: {index: touchIndex},
				bubbles: true
			}));
		}
	}

	function handleTouchEnd(event) {
		let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;

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
				entered.dispatchEvent(new CustomEvent('dropreceive', {
					detail: { x, y, drag: node, drop: window.drop[touchIndex].node },
					bubbles: true
				}));
				entered.dispatchEvent(new CustomEvent('mouseleave', {
					detail: {index: touchIndex},
					bubbles: true
				}));
				entered.dispatchEvent(new CustomEvent('mouseout', {
					detail: {index: touchIndex},
					bubbles: true
				}));
			}
		}
		window.drag[touchIndex] = null;
		window.drop[touchIndex] = null;

		window.removeEventListener('touchmove', handleTouchMove);
	}

	function stopPropagation(event) {
        event.stopPropagation();
	}

	node.addEventListener('touchstart', handleTouchDown, {passive: true});
	node.addEventListener('touchend', handleTouchEnd, {passive: true});

	node.addEventListener('mousedown', handleMousedown);
	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseExit);

    node.addEventListener('mouseover', stopPropagation);
	node.addEventListener('mouseout', stopPropagation);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchDown);
		
			node.removeEventListener('mousedown', handleMousedown);
			node.removeEventListener('mouseup', handleDrop);
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseExit);
			node.removeEventListener('touchend', handleTouchEnd);
		}
	};
}