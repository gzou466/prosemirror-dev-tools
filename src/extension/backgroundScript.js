/* eslint-disable no-undef */

const contentScripts = chrome.app.getDetails().content_scripts[0].js;

function injectIntoTab(tab) {
  contentScripts.forEach(script =>
    chrome.tabs.executeScript(tab.id, { file: script })
  );
}

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === "update") {
    console.log(
      `Update detected! (previousVersion=${previousVersion}) Reinjecting content scripts...`
    );

    chrome.windows.getAll({ populate: true }, windows =>
      windows.forEach(window =>
        window.tabs.forEach(tab => {
          if (!tab.url.match(/(chrome|https):\/\//gi)) {
            injectIntoTab(tab);
          }
        })
      )
    );
  }
});
