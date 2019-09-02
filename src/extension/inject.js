/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import { filter, pipe } from "callbag-basics";

import {
  fromChromeRuntimeMessages,
  fromWindowMessages,
  onlyFromExtension,
  reconnectOnUpgrade,
  rememberSomeMessages,
  repostChromeMessage,
  repostWindowMessage,
  tap
} from "./helpers";

// inject content script
const script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.setAttribute(
  "src",
  chrome.extension.getURL("proseMirrorDevToolsHook.js")
);
document.documentElement.appendChild(script);

// record window messages and replay them selectively when extension is showing
const windowMessages = pipe(
  fromWindowMessages(window),
  onlyFromExtension(),
  rememberSomeMessages([
    { type: "init", pick: "all" },
    { type: "updateState", pick: "latest" }
  ])
);

// this is active only when extension is showing
let repostToChromeMessage = null;

// relay extension messages to content script
repostWindowMessage(window)(
  pipe(
    fromChromeRuntimeMessages(chrome),
    onlyFromExtension(),
    tap(message => {
      if (message.type === "extension-showing") {
        if (message.payload) {
          console.log("Extension showing...");
          repostToChromeMessage = repostChromeMessage(chrome)(windowMessages);
          return;
        }
        console.log("Extension hiding...");
        repostToChromeMessage = null;
      }
    })
  )
);

// reconnect content script on extension upgrade
reconnectOnUpgrade(chrome);
