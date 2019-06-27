export function droppable(node) {
    let hovered = 0;
    
	function handleMouseEnter(event) {
        hovered++;
        event.stopPropagation();
        if (hovered > 1)
            return;
		let x = event.clientX;
		let y = event.clientY;

		let index = event.detail && event.detail.index ? event.detail.index : 0;
		
		if (window.drag[index] && window.drag[index] !== node) {
			window.drop[index] = node;
			node.dispatchEvent(new CustomEvent('dragenter', {
				detail: { x, y },
				bubbles: true
			}));
		} else {
			node.dispatchEvent(new CustomEvent('dragmouseenter', {
				detail: { x, y },
				bubbles: true
			}));
		}
	}

	function handleMouseExit(event) {
        hovered--;
        event.stopPropagation();
		let x = event.clientX;
		let y = event.clientY;

		let index = event.detail && event.detail.index ? event.detail.index : 0;

		if (window.drag[index]) {
			node.dispatchEvent(new CustomEvent('dragexit', {
				detail: { x, y },
				bubbles: true
			}));
			window.drop[index] = null;
		} else {
			node.dispatchEvent(new CustomEvent('dragmouseexit', {
				detail: { x, y },
				bubbles: true
			}));
		}
	}

	node.addEventListener('mouseover', handleMouseEnter);
    node.addEventListener('mouseout', handleMouseExit);
    // node.addEventListener('mouseover', () => {
    //     hovered++;
    //     console.log(hovered, hovered > 0);
    //     event.stopPropagation();
    // });
	// node.addEventListener('mouseout', () => {
    //     hovered--;
    //     console.log(hovered, hovered > 0);
    //     event.stopPropagation();
    // });

	return {
		destroy() {
			node.removeEventListener('mouseover', handleMouseEnter);
			node.removeEventListener('mouseout', handleMouseExit);
		}
	};
}