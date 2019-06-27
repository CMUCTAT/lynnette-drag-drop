import produce from 'immer'
import { writable } from 'svelte/store';

function createHistory() {
    const initial = {past: [], current: null, index: -1, future: [], all: []};
    const { update, set, subscribe } = writable(initial);
    const step = (history, steps) => produce(history, draft => {
        if (steps > 0) {
            let arr = draft.future.slice(0, steps);
            draft.future = steps > draft.future.length ? [] : draft.future.slice(steps, draft.future.length);
            draft.past = draft.past.concat(arr);
        } else {
            let i = Math.max(draft.past.length + steps, 1);
            let arr = draft.past.slice(i, draft.past.length);
            draft.past = draft.past.slice(0, i);
            draft.future = arr.concat(draft.future);
        }
        draft.index = draft.past.length - 1;
        draft.current = draft.past[draft.index];
        draft.all = draft.past.concat(draft.future);
    });
    return {
        subscribe,
        push: state => update(history => produce(history, draft => {
            draft.current = state;
            draft.past.push(draft.current);
            draft.index = draft.past.length - 1;
            draft.future = [];
            draft.all = draft.past.concat(draft.future);
        })),
        step: steps => update(history => step(history, steps)),
        goTo: index => update(history => step(history, index - history.index)),
        reset: () => set(initial),
    }
}

export const history = createHistory();