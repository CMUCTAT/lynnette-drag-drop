export function draggableEqn(node, data) {
	let x;
	let y;
	let px;
	let py;
	let prevList = []
	for (let i = 0; i < 10; i++) {
		prevList.push({x: 0, y: 0});
	}

	let offset;
	let rect = node.getBoundingClientRect();
	console.log(rect);
	
	let entered = null;
	let touchIndex = 0;

	function handleMousedown(event) {
        event.stopPropagation();
		if (event.button !== 0)
			return;
		x = event.clientX;
		y = event.clientY;
		prevList.push({x: event.movementX, y: event.movementY});
		prevList.shift();
		let r = node.getBoundingClientRect();
		offset = {x: x - r.x, y: y - r.y}
        

		node.dispatchEvent(new CustomEvent('dragstart', {
			detail: { x: 0, y: 0 }
		}));

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
	}

	

	function handleMousemove(event) {
		x = event.clientX;
		y = event.clientY;
		prevList.push({x: event.movementX, y: event.movementY});
		prevList.shift();
		node.dispatchEvent(new CustomEvent('dragmove', {
			detail: { x: x - rect.x - offset.x, y: y - rect.y - offset.y, dx: x - px, dy: y - py }
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
		x = event.clientX;
		y = event.clientY;
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
		x = event.clientX;
		y = event.clientY;
		node.dispatchEvent(new CustomEvent('dragmouseenter', {
			detail: { x: x, y: y, dx: x - px, dy: y - py }
		}));
		px = x;
		py = y;
	}

	function handleMouseExit(event) {
        event.stopPropagation();
		x = event.clientX;
		y = event.clientY;
		node.dispatchEvent(new CustomEvent('dragmouseexit', {
			detail: { x: x - offset.x, y: y - offset.y, dx: x - px, dy: y - py }
		}));
		px = x;
		py = y;
	}

	function handleTouchDown(event) {
		if (!(event instanceof TouchEvent))
			return;
		touchIndex = event.changedTouches[0].identifier;
		x = Object.values(event.touches).find(t => t.identifier === touchIndex).clientX;
		y = Object.values(event.touches).find(t => t.identifier === touchIndex).clientY;
		px = x;
		py = y;
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
			detail: { x: x - offset.x, y: y - offset.y, dx: x - px, dy: y - py }
		}));
		px = x;
		py = y;
	}

	function handleTouchEnd(event) {
		
		node.dispatchEvent(new CustomEvent('dragend', {
			detail: { x: x - offset.x, y: y - offset.y, dx: x - px, dy: y - py }
		}));
		px = x;
		py = y;

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