/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import { filter, pipe } from "callbag-basics";
import {
  PROSEMIRROR_DEVTOOLS_CONTENT,
  PROSEMIRROR_DEVTOOLS_BACKGROUND
} from "./constants";
import {
  fromChromeRuntimeMessages,
  fromWindowMessages,
  onlyFromExtension,
  reconnectOnUpgrade,
  replaySomeMessages,
  repostChromeMessage,
  repostWindowMessage,
  tap
} from "./helpers";

function bootstrap() {
  console.log("bootstrap");
  // inject content script
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute(
    "src",
    chrome.extension.getURL("proseMirrorDevToolsHook.js")
  );

  window.addEventListener("message", function({ data }) {
    if (
      data &&
      typeof data === "object" &&
      data.source === PROSEMIRROR_DEVTOOLS_CONTENT
    ) {
      chrome.runtime.sendMessage(data);
    }
  });

  chrome.runtime.onMessage.addListener(message => {
    if (
      message &&
      typeof message === "object" &&
      message.source === PROSEMIRROR_DEVTOOLS_BACKGROUND
    ) {
      window.postMessage(message);
    }
  });

  document.documentElement.appendChild(script);
}

bootstrap();

// reconnect content script on extension upgrade
reconnectOnUpgrade(chrome);
