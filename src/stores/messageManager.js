import { writable } from 'svelte/store';

function createMessageManager() {
	const { subscribe, update } = writable({
        error: null,
        hint: null,
        success: null,
    });

    return {
        subscribe,
        setError: error => update(state => {
            return Object.assign({}, state, {error: error})
        }),
        setHint: hint => update(state => {
            return Object.assign({}, state, {hint: hint})
        }),
        setSuccess: success => update(state => {
            return Object.assign({}, state, {success: success})
        })
    }
}

export const messageManager = createMessageManager();