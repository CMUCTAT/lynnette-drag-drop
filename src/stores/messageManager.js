import { writable } from "svelte/store";

export const showMessages = writable(false);
export const lastCorrect = writable(null);
export const error = writable(null);
export const alienState = writable(null);
