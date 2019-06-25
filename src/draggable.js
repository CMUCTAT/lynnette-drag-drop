export function draggable(node) {
	let x;
	let y;

	let offset;

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
		window.drag = node;
		window.drop = null;
	}

	function handleMousemove(event) {
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
		}));
	}

	function handleMouseup(event) {
		x = event.clientX;
        y = event.clientY;
        // console.log({ x: x - offset.x, y: y - offset.y });
		let dropped = window.drop && window.drop !== node;

		if (dropped) {
			node.dispatchEvent(new CustomEvent('dropsend', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
			}));
		} else {
			node.dispatchEvent(new CustomEvent('dragend', {
				detail: { x: event.clientX - offset.x, y: event.clientY - offset.y }
			}));
		}
		window.drag = null;

		window.removeEventListener('mousemove', handleMousemove);
		window.removeEventListener('mouseup', handleMouseup);
	}

	function handleMouseEnter(event) {
		x = event.clientX;
		y = event.clientY;

		if (window.drag && window.drag !== node) {
			// console.log("drag enter");
			window.drop = node;
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

		if (window.drag) {
			// console.log("drag exit");
			node.dispatchEvent(new CustomEvent('dragexit', {
				detail: { x, y }
			}));
			window.drop = null;
		} else {
			// console.log("mouse exit");
			node.dispatchEvent(new CustomEvent('dragmouseexit', {
				detail: { x, y }
			}));
		}
	}

	function handleDrop(event) {
		if (window.drag && window.drop) {
			node.dispatchEvent(new CustomEvent('droprecieve', {
				detail: { x, y, drag: window.drag, drop: window.drop }
			}));
		}
	}

	node.addEventListener('mousedown', handleMousedown);
	node.addEventListener('mouseup', handleDrop);
	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseExit);

	return {
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
	};
}