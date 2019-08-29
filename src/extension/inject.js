/* eslint-disable no-undef */
import { filter, forEach, tap } from "callbag-basics";
import { fromWindowMessages, messageOfCorrectType } from "./helpers";

let extensionShowing = false;
const chromeExtensionId = chrome.runtime.id;

// inject content script
const script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.setAttribute("src", chrome.extension.getURL("proseMirrorDevTools.js"));
document.documentElement.appendChild(script);

// 1. Relay selected window message to extension
forEach(message =>
  chrome.runtime.sendMessage(chromeExtensionId, message, response => {
    if (response && !response.success) {
      console.warn("error communicating with plugin");
    }
  })
)(
  fromWindowMessages(window),
  tap(message => console.log(`window message => ${JSON.stringify(message)}`)),
  filter(message => extensionShowing && messageOfCorrectType(message))
);

// 2. From extension to content script
chrome.runtime.onMessage.addListener(message => {
  if (!messageOfCorrectType(message)) {
    return;
  }

  // update extensionShowing
  if (message.type === "extension") {
    extensionShowing = message.payload.showing;
  }

  // pass down to pages
  window.postMessage(message, "*");
});
