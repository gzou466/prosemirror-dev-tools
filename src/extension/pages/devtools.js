/* eslint-disable no-undef */

import "../resources/icons/icon-16.png";
import "../resources/icons/icon-128.png";

import { EXTENSION_SOURCE, notifyTabs, reconnectOnUpgrade } from "../helpers";

chrome.devtools.panels.create(
  "ProseMirror",
  "icon-128.png",
  "panels.html",
  panel => {
    panel.onShown.addListener(() =>
      notifyTabs(chrome, {
        source: EXTENSION_SOURCE,
        type: "extension-showing",
        payload: true
      })
    );
    panel.onHidden.addListener(() =>
      notifyTabs(chrome, {
        source: EXTENSION_SOURCE,
        type: "extension-showing",
        payload: false
      })
    );
  }
);

reconnectOnUpgrade(chrome);
