/* eslint-disable no-undef */

import "../resources/icons/icon-16.png";
import "../resources/icons/icon-128.png";

import { notifyTabs } from "../helpers";

chrome.devtools.panels.create(
  "ProseMirror",
  "icon-128.png",
  "panels.html",
  panel => {
    panel.onShown.addListener(() =>
      notifyTabs(chrome, { type: "extension", payload: { showing: true } })
    );
    panel.onHidden.addListener(() =>
      notifyTabs(chrome, { type: "extension", payload: { showing: false } })
    );
  }
);
