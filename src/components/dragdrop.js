/**
 * Drag/drop directive for a node. Will allow a node to be picked up, dragged, and dropped over othse dragdrop nodes
 * 
 * Note that no part of this code changes the position or state of the node it's attached to. It merely maintains internal position and state data, and reports it to the client.
 * Anything involving movement and visual changes is handled by the .svelte file.
 *
 * @export
 * @param {DOMNode} node reference to the DOM node; this parameter is automatically assigned in Svelte
 * @param {Object} params 
 * @returns dragdrop directive
 */
export function dragdrop(node, parameters) { //TODO is type really necessary?
    let x;
    let y;
    let touchIndex = 0; // used to index drag/drop references for multi-touch interfaces
    let offset;
    let entered = null;
    var {type, canDrag} = parameters;  

    
    /**
     * Function for 'mousedown' event listener; registers node with window.drag registry and begins drag operation
     * @param {event} event
     */
    function handleMousedown(event) {
        event.stopPropagation();
        if (event.button !== 0)
            return;
        x = event.clientX;
        y = event.clientY;
        offset = { x, y }
        
        if (canDrag) {
            setNodeDrag(node, type, touchIndex);
            node.dispatchEvent(new CustomEvent('dragstart', {
                detail: { x, y }
            }));

            window.addEventListener('mousemove', handleMousemove);
            window.addEventListener('mouseup', handleMouseup);
        }
    }


    /**
     * Function for 'mousemove' event listener; updates position data for the node
     * @param {event} event
     */
    function handleMousemove(event) {
        const dx = event.clientX - x;
        const dy = event.clientY - y;
        x = event.clientX;
        y = event.clientY;

        node.dispatchEvent(new CustomEvent('dragmove', {
            detail: { x, y, dx, dy }
        }));
    }

    
    /**
     * Function for 'mouseup' event listener; if no drop target is registered, then invoke 'dragend' on the node, otherwise invoke 'dropsend' on drag node, 
     * 'dropreceive' on drop node
     * Basically, if you let it go over nothing, just drop it, else perform some data transfer.
     * @param {event} event
     */
    function handleMouseup(event) {
        event.stopPropagation();
        x = event.clientX;
        y = event.clientY;

        let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;
        if (dropped) {
            node.dispatchEvent(new CustomEvent('dropsend', {
                detail: { x, y },
            }));
            window.drop[touchIndex].node.dispatchEvent(new CustomEvent('dropreceive', {
                detail: { x, y, drag: window.drag[touchIndex], drop: window.drop[touchIndex] },
            }));
            // node.dispatchEvent(new CustomEvent('dragend', {
            //     detail: { x, y }
            // }));
            // node.dispatchEvent(new CustomEvent('leave', {
            //     detail: { x, y }
            // }));
            // window.drop[touchIndex].node.dispatchEvent(new CustomEvent('dragleave', {
            //     detail: { x, y }
            // }));
        } else {
            node.dispatchEvent(new CustomEvent('dragend', {
                detail: { x, y }
            }));
            node.dispatchEvent(new CustomEvent('leave', {
                detail: { x, y }
            }));
        }
        unsetNodeDrag(touchIndex);
        unsetNodeDrop(touchIndex);

        window.removeEventListener('mousemove', handleMousemove);
        window.removeEventListener('mouseup', handleMouseup);

    }

    /**
     * Function for 'mouseenter' event listener; if dragging an object, trigger the 'dragenter' event on the node, if not, trigger the 'enter' event;
     * Mainly used to set the hover effects and drop target
     * @param {event} event 
     */
    function handleMouseenter(event) {
        event.stopPropagation();
        x = event.clientX;
        y = event.clientY;
        

        let index = event.detail instanceof Object ? event.detail.index : 0;

        if (window.drag[index] && window.drag[index].node !== node) {
            setNodeDrop(node, type, index);
            node.dispatchEvent(new CustomEvent('dragenter', {
                detail: { x, y },
            }));
        } else {
            node.dispatchEvent(new CustomEvent('enter', {
                detail: { x, y },
            }));
        }
    }

    /**
     * Function for 'mouseleave' event listener; if dragging an object, trigger the 'dragleave' event on the node, if not, trigger the 'leave' event;
     * Mainly used to unset the hover effects and drop target
     * @param {event} event
     */
    function handleMouseleave(event) {
        event.stopPropagation();

        x = event.clientX;
        y = event.clientY;
        

        let index = event.detail instanceof Object ? event.detail.index : 0;
        
        if (window.drag[index]) {
            unsetNodeDrop(index);
            node.dispatchEvent(new CustomEvent('dragleave', {
                detail: { x, y },
            }));
            // document.elementFromPoint(x, y).parentElement.parentElement.dispatchEvent(new CustomEvent('dragenter', {
            //     detail: { x, y },
            // }))
        } else {
            node.dispatchEvent(new CustomEvent('leave', {
                detail: { x, y },
            }));
            // document.elementFromPoint(x, y).dispatchEvent(new CustomEvent('enter', {
            //     detail: { x, y },
            // }))
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
        offset = { x, y }


        node.dispatchEvent(new CustomEvent('dragstart', {
            detail: { dx: x - offset.x, dy: y - offset.y }
        }));

        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.drag[touchIndex] = { node: node, type: type };
        window.drop[touchIndex] = null;
    }

    function handleTouchMove(event) {
        let curEvent = Object.values(event.touches).find(t => t.identifier === touchIndex);

        x = curEvent.clientX;
        y = curEvent.clientY;

        
        node.dispatchEvent(new CustomEvent('dragmove', {
            detail: { dx: x - offset.x, dy: y - offset.y }
        }));

        offset = { x, y }

        var element = document.elementFromPoint(x, y);
        if (!element)
            return;
        if (element !== entered) {
            if (entered) {
                entered.dispatchEvent(new CustomEvent('leave', {
                    detail: { index: touchIndex },
                    bubbles: true
                }));
                // entered.dispatchEvent(new CustomEvent('mouseout', {
                //     detail: { index: touchIndex },
                //     bubbles: true
                // }));
            }
            entered = element;
            entered.dispatchEvent(new CustomEvent('enter', {
                detail: { index: touchIndex },
                bubbles: true
            }));
            // entered.dispatchEvent(new CustomEvent('mouseover', {
            //     detail: { index: touchIndex },
            //     bubbles: true
            // }));
        }
    }

    function handleTouchEnd(event) {        
        let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;

        if (dropped) {
            node.dispatchEvent(new CustomEvent('dropsend', {
                detail: { x, y }
            }));
        } else {
            node.dispatchEvent(new CustomEvent('dragend', {
                detail: { x, y }
            }));
        }
        if (entered) {
            if (window.drag[touchIndex] && window.drop[touchIndex]) {
                entered.dispatchEvent(new CustomEvent('dropreceive', {
                    detail: { x, y, drag: node, drop: window.drop[touchIndex].node },
                    bubbles: true
                }));
                entered.dispatchEvent(new CustomEvent('mouseleave', {
                    detail: { index: touchIndex },
                    bubbles: true
                }));
                entered.dispatchEvent(new CustomEvent('mouseout', {
                    detail: { index: touchIndex },
                    bubbles: true
                }));
            }
        }
        window.drag[touchIndex] = null;
        window.drop[touchIndex] = null;

        window.removeEventListener('touchmove', handleTouchMove);
    }

    //Add all event listeners to node
    node.addEventListener('mousedown', handleMousedown);
    node.addEventListener('mouseover', handleMouseenter);
    node.addEventListener('mouseout', handleMouseleave);

    node.addEventListener('touchstart', handleTouchDown, { passive: true });
    node.addEventListener('touchend', handleTouchEnd, { passive: true });

    return {
        update(parameters) {
            ({canDrag, type} = parameters)
        },
        //When node is destroyed, all event listeners need to be destroyed too
        destroy() {
            node.removeEventListener('mousedown', handleMousedown);
            node.removeEventListener('mouseover', handleMouseenter);
            node.removeEventListener('mouseout', handleMouseleave);
            node.removeEventListener('touchstart', handleTouchDown);
            node.removeEventListener('touchend', handleTouchEnd);
        }
    };
}

/**
 * Create a reference to the currently dragged node in the window so that it can be referenced later
 * @param {DOMNode} node DOM node of the element being dragged
 * @param {Enum} type type of the element being dragged; used to determine valid drop targets
 * @param {int} index touch index of drag operation; used only with touchscreens which allow for multi-touch
 */
function setNodeDrag(node, type, index = 0) {
    window.drag[index] = { node, type };
}

/**
 * Unsets the referece to the currently dragged node, because I use null checks to determine what operations to launch; called on 'mouseup' when the user is dragging 
 * @param {int} index touch index of the drag operation; used only with touchscreens which allow for multi-touch
 */
function unsetNodeDrag(index = 0) {
    window.drag[index] = null;
}

/**
 * Create a reference to the node currently being dragged over in the window so that it can be referenced later (to call the 'dropreceive' event on it on drop for example)
 * @param {DOMNode} node DOM node of the element being hovered over
 * @param {Enum} type type of the element being hovered over; used to determine valid drop targets
 * @param {int} index touch index of drag operation; used only with touchscreens which allow for multi-touch
 */
function setNodeDrop(node, type, index = 0) {
    window.drop[index] = { node, type };
}

/**
 * Unsets the referece to the node currently being dragged over, because I use null checks to determine what operations to launch; called on 'mouseleave' when the user is dragging
 * @param {int} index touch index of the drag operation; used only with touchscreens which allow for multi-touch
 */
function unsetNodeDrop(index = 0) {
    window.drop[index] = null;
}
