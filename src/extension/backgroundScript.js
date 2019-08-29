/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const manifest = chrome.runtime.getManifest();

chrome.runtime.onInstalled.addListener(({ reason, previousVersion, id }) => {
  if (reason === "update") {
    console.log("Update detected!");
  }
});
