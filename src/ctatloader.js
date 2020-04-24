/**-----------------------------------------------------------------------------
 $Author: sewall $
 $Date: 2016-12-15 12:33:36 -0500 (Thu, 15 Dec 2016) $
 $HeadURL: svn://pact-cvs.pact.cs.cmu.edu/usr5/local/svnroot/AuthoringTools/trunk/HTML5/ctatloader.js $
 $Revision: 24444 $

 -
 License:
 -
 ChangeLog:
 -
 Notes:

 */
console.log("Starting ctatloader ...");
if (frameElement && typeof frameElement.getAttribute == "function") {
  let dpAttr = frameElement.getAttribute("data-params");
  let dpObj = null;
  if (dpAttr && (dpObj = JSON.parse(dpAttr)) && dpObj.hasOwnProperty("CTATTarget")) {
    var CTATTarget = dpObj["CTATTarget"];
  }
}

// Set CTATTarget to Default if not already set.
if (typeof CTATTarget == "undefined" || !CTATTarget) {
  console.log("CTATTarget not defined, setting it to 'Default' ...");
  var CTATTarget = "Default";
} else {
  console.log("CTATTarget already defined at top of ctatloader, set to: " + CTATTarget);
}

console.log("Double checking target: " + CTATTarget);

function startCTAT() {
  initTutor();

  // Once all the CTAT code has been loaded allow developers to activate custom code

  if (window.hasOwnProperty("ctatOnload")) {
    window["ctatOnload"]();
  } else {
    console.log("Warning: window.ctatOnload is not available");
  }
}
/**
 *
 */
function initOnload() {
  console.log("initOnload ()");

  //>-------------------------------------------------------------------------

  if (CTATLMS.is.Authoring() || CTATTarget === "AUTHORING") {
    console.log('(CTATTarget=="AUTHORING")');

    var session = "" || CTATConfiguration.get("session_id");
    var port = "" || CTATConfiguration.get("remoteSocketPort");
    if (window.location.search) {
      var p = /[?&;]port=(\d+)/i.exec(window.location.search);
      if (p && p.length >= 2) {
        port = decodeURIComponent(p[1].replace(/\+/g, " "));
      }
      var s = /[?&;]session=([^&]*)/i.exec(window.location.search);
      if (s && s.length >= 2) {
        session = decodeURIComponent(s[1].replace(/\+/g, " "));
      }
    }
    CTATConfiguration.set("tutoring_service_communication", "websocket");
    CTATConfiguration.set("user_guid", "author");
    CTATConfiguration.set("question_file", "");
    CTATConfiguration.set("session_id", session);
    CTATConfiguration.set("remoteSocketPort", port);
    CTATConfiguration.set("remoteSocketURL", "127.0.0.1");

    startCTAT();
    return;
  }

  //>-------------------------------------------------------------------------

  if (CTATLMS.is.OLI()) {
    // Do nothing as OLI will call initTutor and ctatOnload.
    // Should probably move to a similar mechanism as XBlock
    console.log("CTATTarget=='OLI'");
    return;
  }

  //>-------------------------------------------------------------------------

  if (CTATLMS.is.SCORM()) {
    console.log("CTATTarget=='SCORM'");

    CTATLMS.init.SCORM();
    // Initialize our own code ...
    startCTAT();
    return;
  }

  //>-------------------------------------------------------------------------

  // if (CTATLMS.is.Assistments()) {
  // 	console.log("CTATTarget=='ASSISTMENTS'");

  // 	iframeLoaded(); // Assistments specific call

  // 	// Initialize our own code ...
  // 	startCTAT();
  // 	return;
  // }

  //>-------------------------------------------------------------------------

  if (CTATLMS.is.XBlock()) {
    console.log("CTATTarget=='XBlock'");

    CTATLMS.init.XBlock();
    // listen for configuration block
    window.addEventListener("message", function (event) {
      console.log("recieved message", event.origin, document.referrer, event.data);
      if (!document.referrer && event.origin !== new URl(document.referrer).origin) {
        console.log("Message not from valid source:", event.origin, "Expected:", document.referrer); // TODO: remove expected
        return;
      }
      if (!CTATTutor.tutorInitialized && "question_file" in event.data) {
        // looks like we have configuration
        initTutor(event.data);
        if (window.hasOwnProperty("ctatOnload")) {
          window["ctatOnload"]();
        }
      }
      // Should probably remove listener once configuration is received
      // so that malicious hackers do not cause multiple initializations.
    });
    return;
  }

  //>-------------------------------------------------------------------------

  /*
   * The target CTAT is synonymous with TutorShop. You can use this target outside of
   * TutorShop if you use the same directory structure for the css, js and brd files
   */
  if (CTATTarget == "CTAT" || CTATTarget == "LTI" || CTATLMS.is.TutorShop()) {
    console.log("CTATTarget=='CTAT'");

    CTATLMS.init.TutorShop();
    startCTAT();

    return;
  }

  //>-------------------------------------------------------------------------

  /*
   * This target is available to you if you would like to either develop your own
   * Learner Management System or would like to test and run your tutor standalone.
   * NOTE! This version will NOT call initTutor since that is the responsibility
   * of the author in this case.
   */
  if (CTATTarget == "Default") {
    console.log("CTATTarget=='Default'");

    // Once all the CTAT code has been loaded allow developers to activate custom code

    if (window.hasOwnProperty("ctatOnload")) {
      window["ctatOnload"]();
    } else {
      console.log("Warning: window.ctatOnload is not available, running initTutor()");
      initTutor();
    }

    return;
  }

  //>-------------------------------------------------------------------------
}

import * as commHandlers from "./commShellExtension";
/**
 *
 */
if (window.jQuery) {
  $(function () {
    CTATScrim.scrim.waitScrimUp();
    console.log("$(window).load(" + CTATTarget + ")");
    initOnload();
    CTATCommShell.commShell.assignDoneProcessor((input, finish) => {
      commHandlers.onSuccess(finish);
    });
    CTATCommShell.commShell.addGlobalEventListener({
      processCommShellEvent: (evt, msg) => {
        // console.log(evt, msg);
        switch (evt) {
          case "BuggyMessage":
            commHandlers.handleBuggyMessage(evt, msg);
            break;
          case "InterfaceAction":
            commHandlers.handleInterfaceAction(evt, msg);
            break;
          case "CorrectAction":
            commHandlers.handleCorrectAction(evt, msg);
            break;
          case "InCorrectAction":
            commHandlers.handleInCorrectAction(evt, msg);
            break;
          case "BuggyMessage":
            commHandlers.handleBuggyMessage(evt, msg);
            break;
          case "ShowHintsMessage":
            commHandlers.handleShowHintsMessage(evt, msg);
            break;
          case "SuccessMessage":
            commHandlers.handleSuccessMessage(evt, msg);
            break;
          default:
            break;
        }
      },
    });
  });
} else {
  console.log("Error: JQuery not available, can not execute $(window).on('load',...)");
}
