import { writable } from 'svelte/store';

const initial = {
    error: null,
    hint: null,
    success: null,
    side: null,
}

function createMessageManager() {
	const { subscribe, update, set } = writable(initial);

    return {
        subscribe,
        setError: message => update(state => {
            return Object.assign({}, state, {error: {message: message}})
        }),
        setHint: message => update(state => {
            return Object.assign({}, state, {hint: {message: message}})
        }),
        setSuccess: message => update(state => {
            return Object.assign({}, state, {success: {message: message}})
        }),
        setSide: side => update(state => {

            return Object.assign({}, state, {side: side});
        }),
        reset: () => set(initial),
    }
}

export const messageManager = createMessageManager();