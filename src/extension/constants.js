// Event types
export const REGISTER_INSPECTED_TAB = "registerInspectedTabId";
export const NOTIFY_DEV_PANEL_VISIBILITY = "notifyDevPanelVisibility";

// Event sources
export const EXTENSION_SOURCE = "prosemirror-devtools-bridge";
// export const DEV_TOOLS_SOURCE = "prosemirror-devtools-dev-tools";
// export const BACKGROUND_SCRIPT_SOURCE =
//   "prosemirror-devtools-background-script";

// Locations
// Can be use as source or target in events.
// From/To proseMirrorDevToolsHook.js inject.js
export const PROSEMIRROR_DEVTOOLS_CONTENT = "prosemirror-devtools-content";
// From/To backgroundScript.js
export const PROSEMIRROR_DEVTOOLS_BACKGROUND =
  "prosemirror-devtools-background";
// From/To pages/devtools.js or panels/index.js
export const PROSEMIRROR_DEVTOOLS_PANEL = "prosemirror-devtools-devtool";
