/* eslint-disable no-undef */
import { filter, pipe } from "callbag-basics";

import {
  fromChromeRuntimeMessages,
  fromWindowMessages,
  onlyFromExtension,
  repostChromeMessage,
  repostWindowMessage,
  tap
} from "./helpers";

let extensionShowing = false;

// inject content script
const script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.setAttribute(
  "src",
  chrome.extension.getURL("proseMirrorDevToolsHook.js")
);
document.documentElement.appendChild(script);

// relay selected window messages to extension when active
repostChromeMessage(chrome)(
  fromWindowMessages(window),
  onlyFromExtension(),
  filter(() => extensionShowing),
  tap(message =>
    console.log(`from window to extension => ${JSON.stringify(message)}`)
  )
);

// relay extension messages to content script
repostWindowMessage(window)(
  pipe(
    fromChromeRuntimeMessages(chrome),
    onlyFromExtension(),
    tap(message => {
      if (message.type === "extension-showing") {
        extensionShowing = message.payload;
      }
    })
  )
);
