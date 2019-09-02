/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { injectIntoTab } from "./helpers";

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason === "update") {
    console.log(`Update detected! (previousVersion=${previousVersion})`);

    // chrome.windows.getAll({ populate: true }, windows =>
    //   windows.forEach(window =>
    //     window.tabs.forEach(tab => {
    //       if (!tab.url.match(/(chrome|https):\/\//gi)) {
    //         injectIntoTab(chrome, tab);
    //       }
    //     })
    //   )
    // );
  }
});
