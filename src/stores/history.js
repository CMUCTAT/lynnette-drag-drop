import { writable } from "svelte/store"
import produce from "immer"

function createHistory() {
  const initial = { past: [], current: null, index: -1, future: [], all: [] }
  const { update, set, subscribe } = writable(initial)
  const step = (history, steps) =>
    produce(history, draft => {
      if (steps > 0) {
        let arr = draft.future.slice(0, steps)
        draft.future = steps > draft.future.length ? [] : draft.future.slice(steps, draft.future.length)
        draft.past = draft.past.concat(arr)
      } else {
        let index = Math.max(draft.past.length + steps, 1),
            arr = draft.past.slice(index, draft.past.length)
        draft.past = draft.past.slice(0, index)
        draft.future = arr.concat(draft.future)
      }
      draft.index = draft.past.length - 1
      draft.current = draft.past[draft.index]
      draft.all = draft.past.concat(draft.future)
    })
  return {
    subscribe,
    push: (state) =>
      update(history =>
        produce(history, draft => {
          draft.current = state
          draft.past.push(draft.current)
          draft.index = draft.past.length - 1
          draft.future = []
          draft.all = draft.past.concat(draft.future)
        })
      ),
    step: (steps) => update(history => step(history, steps)),
    goTo: (index) => update(history => step(history, index - history.index)),
    undo: () =>
      update(history => {
        return produce(step(history, -1), (draft) => {
          draft.future = draft.future.slice(1)
          draft.all = draft.past.concat(draft.future)
        })
      }),
    reset: () => set(initial)
  }
}

export const history = createHistory()
