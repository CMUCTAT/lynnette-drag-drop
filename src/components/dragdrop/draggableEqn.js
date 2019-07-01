export function draggableEqn(node, coords) {
	let x = 0;
	let y = 0;
	let prevList = []
	for (let i = 0; i < 10; i++) {
		prevList.push({x: 0, y: 0});
	}

	let offset;
	let start;
	
	let entered = null;
	let touchIndex = 0;

	function handleMousedown(event) {
        event.stopPropagation();
		if (event.button !== 0)
			return;
		// x = event.clientX;
		// y = event.clientY;
		var style = window.getComputedStyle(node);
		var matrix = new WebKitCSSMatrix(style.webkitTransform);
		start = {x: matrix.m41, y: matrix.m42}
		
		prevList.push({x: event.movementX, y: event.movementY});
		prevList.shift();
		if (!offset) {
			offset = { x: event.clientX, y: event.clientY }
		} else {
			offset = { x: event.clientX, y: event.clientY }
		}


		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: 0, y: 0 }
		}));

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
	}

	

	function handleMousemove(event) {
		x = event.clientX - offset.x + start.x;
		y = event.clientY - offset.y + start.y;
		prevList.push({x: event.movementX, y: event.movementY});
		prevList.shift();
		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: x , y: y }
		}));
	}

	function avg() {
		let ax = 0;
		let ay = 0;
		for (let i = 0; i < prevList.length; i++) {
			ax += prevList[i].x;
			ay += prevList[i].y;
		}
		return {x: ax / prevList.length, y: ay / prevList.length}
	}

	function handleMouseup(event) {
        event.stopPropagation();
		x = event.clientX - offset.x + start.x;
		y = event.clientY - offset.y + start.y;
		let a = avg();
		
		node.dispatchEvent(new CustomEvent('dragend', {
			detail: { x: x - offset.x, y: y - offset.y, dx: a.x, dy: a.y }
		}));

		window.removeEventListener('mousemove', handleMousemove);
		window.removeEventListener('mouseup', handleMouseup);
		prevList = [];
		for (let i = 0; i < 10; i++) {
			prevList.push({x: 0, y: 0});
		}
		
	}

	function handleMouseEnter(event) {
        event.stopPropagation();
		node.dispatchEvent(new CustomEvent('dragmouseenter'));
	}

	function handleMouseExit(event) {
        event.stopPropagation();
		node.dispatchEvent(new CustomEvent('dragmouseexit'));
	}

	function handleTouchDown(event) {
		if (!(event instanceof TouchEvent))
			return;
		touchIndex = event.changedTouches[0].identifier;
		x = Object.values(event.touches).find(t => t.identifier === touchIndex).clientX;
		y = Object.values(event.touches).find(t => t.identifier === touchIndex).clientY;
        offset = {x: x, y: y}
        
		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: 0, y: 0 }
		}));

		window.addEventListener('touchmove', handleTouchMove, {passive: true});
	}

	function handleTouchMove(event) {
		x = Object.values(event.touches).find(t => t.identifier === touchIndex).clientX;
		y = Object.values(event.touches).find(t => t.identifier === touchIndex).clientY;

		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: x - offset.x, y: y - offset.y }
		}));
	}

	function handleTouchEnd(event) {
		
		node.dispatchEvent(new CustomEvent('dragend', {
			detail: { x: x - offset.x, y: y - offset.y }
		}));

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
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseExit);
			node.removeEventListener('touchend', handleTouchEnd);
		}
	};
}