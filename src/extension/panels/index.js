/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import * as React from "react";
import * as ReactDom from "react-dom";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { Provider } from "unstated";
import { forEach, pipe } from "callbag-basics";
import * as OrderedMap from "orderedmap";

import { onlyOfType, fromChromeDevToolsPort, tap } from "../helpers";

import DevTools from "../../dev-tools-extension";
import EditorStateContainer from "../../state/editor";
import GlobalStateContainer from "../../state/global";
import { PROSEMIRROR_DEVTOOLS_PANEL } from "../constants";

const devToolsPort = chrome.runtime.connect();
devToolsPort.postMessage({
  type: "registerInspectedTabId",
  inspectedTabId: chrome.devtools.inspectedWindow.tabId
});
devToolsPort.onDisconnect.addListener(function() {
  console.log(
    "Disconnected from tab " + chrome.devtools.inspectedWindow.tabId + "."
  );
});

function receiveMessage(event) {
  const {
    data: { source, type, data }
  } = event;

  if (source === PROSEMIRROR_DEVTOOLS_PANEL) {
    devToolsPort.postMessage({
      type,
      data,
      source,
      inspectedTabId: chrome.devtools.inspectedWindow.tabId
    });
  }
}

window.addEventListener("message", receiveMessage, false);

const globalState = new GlobalStateContainer({ opened: true, defaultSize: 1 });
let editorState;
let schemaStr = null;
let schema = null;
let editorId = "";

globalState.toggleDevTools();

function DevToolsExtension() {
  return (
    <Provider inject={[globalState, editorState]}>
      <DevTools />
    </Provider>
  );
}

const initHandler = message => {
  schemaStr = message.payload.schemaStr;
  editorId = message.payload.editorId;

  const schemaSpec = JSON.parse(schemaStr);

  let nodesMap = OrderedMap.from({});
  let marksMap = OrderedMap.from({});

  while (schemaSpec.marks.content.length) {
    const key = schemaSpec.marks.content.shift();
    const value = schemaSpec.marks.content.shift();
    marksMap = marksMap.addToEnd(key, value);
  }

  while (schemaSpec.nodes.content.length) {
    const key = schemaSpec.nodes.content.shift();
    const value = schemaSpec.nodes.content.shift();
    // HACK don't touch this.
    if (key === "layoutSection") {
      delete value.content;
    }
    nodesMap = nodesMap.addToEnd(key, value);
  }

  schema = new Schema({
    nodes: nodesMap,
    marks: marksMap
  });

  return {
    state: EditorState.fromJSON({ schema }, message.payload.state),
    _props: {
      dispatchTransaction: () => {}
    }
  };
};

forEach(message => {
  const { type, payload } = message;
  console.log("updateState", message);
  if (type === "updateState") {
    if (
      !editorState ||
      (payload.schemaStr && schemaStr !== payload.schemaStr) ||
      (payload.editorId && editorId !== payload.editorId)
    ) {
      try {
        const editorView = initHandler(message);
        editorState = new EditorStateContainer(editorView, { EditorState });
        ReactDom.unmountComponentAtNode(document.getElementById("root"));
        ReactDom.render(<DevToolsExtension />, document.getElementById("root"));
      } catch (e) {
        console.error("Could not initialize devtools from Editor!", e);
      }
    } else {
      const { state } = payload;
      const newState = EditorState.fromJSON({ schema }, state);
      editorState.pushNewState(newState);
    }
  }
})(
  pipe(
    fromChromeDevToolsPort(devToolsPort),
    onlyOfType(["updateState"])
    // tap(message => console.log(`Got Editor msg: ${JSON.stringify(message)}`))
  )
);
