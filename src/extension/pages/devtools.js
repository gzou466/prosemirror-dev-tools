/* eslint-disable no-undef */

import "../resources/icons/icon-16.png";
import "../resources/icons/icon-128.png";

import {
  NOTIFY_DEV_PANEL_VISIBILITY,
  PROSEMIRROR_DEVTOOLS_PANEL
} from "../constants";

chrome.devtools.panels.create(
  "ProseMirror",
  "icon-128.png",
  "panels.html",
  panel => {
    let panelWindow;

    const notifyDevPanelVisibility = visibility => {
      if (panelWindow && typeof panelWindow.postMessage === "function") {
        return panelWindow.postMessage({
          type: NOTIFY_DEV_PANEL_VISIBILITY,
          source: PROSEMIRROR_DEVTOOLS_PANEL,
          data: { visibility }
        });
      }
    };

    panel.onShown.addListener(newPanelWindow => {
      panelWindow = newPanelWindow;
      notifyDevPanelVisibility(true);
    });
    panel.onHidden.addListener(() => {
      notifyDevPanelVisibility(false);
    });
  }
);
