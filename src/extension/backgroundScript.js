/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { injectIntoTab } from "./helpers";
import {
  REGISTER_INSPECTED_TAB,
  NOTIFY_DEV_PANEL_VISIBILITY,
  PROSEMIRROR_DEVTOOLS_BACKGROUND
} from "./constants";

// tabId -> devtool port
const inspectedTabs = {};

// TODO: implement buffer, tabId -> buffered data
/*
{
  [tabId]: {
    [editorId]: {
      state: obj,
      schemaSpec: obj
    }
  }
}
*/
// const data = {};

function brokerMessage(message, sender) {
  console.log(message, sender);
  const tabId = sender.tab.id,
    devToolsPort = inspectedTabs[tabId];
  console.log(tabId, devToolsPort);
  if (devToolsPort) {
    devToolsPort.postMessage(message);
  }
}

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === "update") {
    console.log(`Update detected! (previousVersion=${previousVersion})`);

    chrome.windows.getAll({ populate: true }, windows =>
      windows.forEach(window =>
        window.tabs.forEach(tab => {
          if (!tab.url.match(/(chrome|https):\/\//gi)) {
            injectIntoTab(chrome, tab);
          }
        })
      )
    );
  }
});

// context script –> background
chrome.runtime.onMessage.addListener(brokerMessage);

chrome.runtime.onConnect.addListener(function(devToolsPort) {
  devToolsPort.onMessage.addListener(messageDispatcher);

  function messageDispatcher(event) {
    const { inspectedTabId, type, data = null } = event;
    switch (type) {
      case REGISTER_INSPECTED_TAB:
        inspectedTabs[inspectedTabId] = devToolsPort;
        devToolsPort.onDisconnect.addListener(function() {
          delete inspectedTabs[inspectedTabId];
        });
        break;
      case NOTIFY_DEV_PANEL_VISIBILITY:
        chrome.tabs.sendMessage(inspectedTabId, {
          type,
          data,
          source: PROSEMIRROR_DEVTOOLS_BACKGROUND
        });
        break;
    }
  }
});
