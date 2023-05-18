/**
 * The following functions handle messages recieved from the CTATCommShell located in ctatloader.js
 * Documentation for these events are located here: https://github.com/CMUCTAT/CTAT/wiki/API#events
 *
 * The one event that won't be on there is onSuccess(), which is called by an eventlistener on the
 * CTATCommShell whenever the student has completed a problem
 */

import { get } from 'svelte/store'
import { showMessages, lastCorrect, error, alienState } from '$stores/messageManager.js'
// import { draftEquation } from '$stores/equation.js'
import { history } from '$stores/history.js'
import { soundEffects } from '$utils/soundEffect.js'

function onSuccess(finish, delay = 500) {
  alienState.set('success')
  showMessages.set(false)
  soundEffects.play('haHa')
  setTimeout(() => {
    finish()
  }, delay)
}

function handleCorrectAction(evt, msg) {
  showMessages.set(false)
  lastCorrect.set(get(history).current)
  alienState.set(null)
}

function handleInCorrectAction(evt, msg) {
  let sai = msg.getSAI()
  if (sai.getSelection() != 'done') {
    error.set(sai.getSelection())
    if (get(alienState) !== 'error') {
      showMessages.set(false)
      soundEffects.play('hmm')
      alienState.set('error')
    }
    // if (get(history).current === get(lastCorrect)) {
    //   setTimeout(() => {
    //     error.set(null)
    //   }, 3000)
    // }
  }
}

function handleHighlightMsg(evt, msg) { }

function handleUnHighlightMsg(evt, msg) { }

function handleStateGraph(evt, msg) { }

function handleStartProblem(evt, msg) { }

function handleAssociatedRules(evt, msg) { }

function handleBuggyMessage(evt, msg) {
  showMessages.set(true)
  if (get(alienState) !== 'error') {
    soundEffects.play('hmm')
    alienState.set('error')
  }
}

function handleSuccessMessage(evt, msg) {
  alienState.set('success')
  soundEffects.play('haHa')
}

function handleInterfaceAction(evt, msg) {
  if (!msg || typeof msg === 'string' || msg instanceof String) return undefined
  let sai = msg.getSAI(),
      input = sai.getInput()
  if (input) {
    let parsedInput = window.parser.algParse(input)
    history.push(parsedInput)
    lastCorrect.set(parsedInput)
    // draftEquation.set(window.parser.algParse(input))
    // draftEquation.apply()
  }
}

function handleShowHintsMessage(evt, msg) {
  showMessages.set(true)
  alienState.set('hint')
}

function handleTutoringServiceError(evt, msg) { }

function handleProblemSummaryResponse(evt, msg) { }

function handleProblemRestoreEnd(evt, msg) { }

// These events do not provide a pointer to a CTATMessage as the argument to the callback.

function handleRequestHint(evt) { }

function handleDonePressed(evt) { }

function handleNextPressed(evt) { }

function handlePreviousPressed(evt) { }

document.addEventListener('tutorInitialized',
  () => {
    CTATCommShell.commShell.assignDoneProcessor((input, finish) => {
      onSuccess(finish)
    })
    CTATCommShell.commShell.addGlobalEventListener({
      processCommShellEvent: (evt, msg) => {
        switch (evt) {
          case 'BuggyMessage':
            handleBuggyMessage(evt, msg)
            break
          case 'InterfaceAction':
            handleInterfaceAction(evt, msg)
            break
          case 'CorrectAction':
            handleCorrectAction(evt, msg)
            break
          case 'InCorrectAction':
            handleInCorrectAction(evt, msg)
            break
          case 'BuggyMessage':
            handleBuggyMessage(evt, msg)
            break
          case 'ShowHintsMessage':
            handleShowHintsMessage(evt, msg)
            break
          case 'SuccessMessage':
            handleSuccessMessage(evt, msg)
            break
          case 'AssociatedRules':
            break
          default:
            break
        }
      }
    })
  }
)
