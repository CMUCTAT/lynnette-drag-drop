import produce from 'immer'
import { writable } from 'svelte/store';
import { history } from 'history.js'

function createEquationDraft() {
    const initial;
    const { update, set, subscribe } = writable(initial);
    return {
        subscribe,
        apply: () => update(eqn => {
            history.push(eqn);
        }),
        set
    }
}