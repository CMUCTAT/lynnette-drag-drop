/**
 * The following functions handle messages recieved from the CTATCommShell located in ctatloader.js
 * Documentation for these events are located here: https://github.com/CMUCTAT/CTAT/wiki/API#events
 *
 * The one event that won't be on there is onSuccess(), which is called by an eventlistener on the
 * CTATCommShell whenever the student has completed a problem
 */

import { showMessages, lastCorrect, error, alienState } from './stores/messageManager';
import { draftEquation } from './stores/equation';
import { history } from './stores/history';
import { get } from 'svelte/store';
import soundEffects from './soundEffect';

export function onSuccess(finish, delay = 500) {
  alienState.set('success');
  showMessages.set(false);
  soundEffects.play('haHa');
  setTimeout(() => {
    finish();
  }, delay);
}

export function handleCorrectAction(evt, msg) {
  showMessages.set(false);
  lastCorrect.set(get(history).current);
  alienState.set(null);
}

export function handleInCorrectAction(evt, msg) {
  var sai = msg.getSAI();
  if (sai.getSelection() != 'done') {
    error.set(sai.getSelection());
    if (get(alienState) !== 'error') {
      showMessages.set(false);
      soundEffects.play('hmm');
      alienState.set('error');
    }
  }
}

export function handleHighlightMsg(evt, msg) {
  console.log(1);
}

export function handleUnHighlightMsg(evt, msg) {}

export function handleStateGraph(evt, msg) {}

export function handleStartProblem(evt, msg) {}

export function handleAssociatedRules(evt, msg) {}

export function handleBuggyMessage(evt, msg) {
  showMessages.set(true);
  if (get(alienState) !== 'error') {
    soundEffects.play('hmm');
    alienState.set('error');
  }
}

export function handleSuccessMessage(evt, msg) {
  alienState.set('success');
  soundEffects.play('haHa');
}

export function handleInterfaceAction(evt, msg) {
  if (!msg || typeof msg === 'string' || msg instanceof String) return;
  var sai = msg.getSAI();
  var input = sai.getInput();
  console.log('INPUT:', input);
  if (input) {
    let parsedInput = parse.algParse(input);
    history.push(parsedInput);
    lastCorrect.set(parsedInput);
    // draftEquation.set(parse.algParse(input))
    // draftEquation.apply()
  }
}

export function handleShowHintsMessage(evt, msg) {
  console.log(msg.getXMLString());

  showMessages.set(true);
  alienState.set('hint');
}

export function handleTutoringServiceError(evt, msg) {}

export function handleProblemSummaryResponse(evt, msg) {}

export function handleProblemRestoreEnd(evt, msg) {}

// These events do not provide a pointer to a CTATMessage as the argument to the callback.

export function handleRequestHint(evt) {
  console.log(evt);
}

export function handleDonePressed(evt) {
  console.log(evt);
}

export function handleNextPressed(evt) {
  console.log(evt);
}

export function handlePreviousPressed(evt) {
  console.log(evt);
}
