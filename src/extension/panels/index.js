/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import * as React from "react";
import * as ReactDom from "react-dom";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { Provider } from "unstated";
import { forEach, pipe } from "callbag-basics";
import * as OrderedMap from "orderedmap";

import {
  fromChromeRuntimeMessages,
  onlyFromExtension,
  onlyOfType,
  tap
} from "../helpers";

import DevTools from "../../dev-tools-extension";
import EditorStateContainer from "../../state/editor";
import GlobalStateContainer from "../../state/global";

const globalState = new GlobalStateContainer({ opened: true, defaultSize: 1 });
let editorState;
let initialized = false;
let schema = null;

globalState.toggleDevTools();

function DevToolsExtension() {
  return (
    <Provider inject={[globalState, editorState]}>
      <DevTools />
    </Provider>
  );
}

const initHandler = message => {
  const { schemaSpec, state, viewAttrs } = message.payload;

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

  const editorView = {
    state: EditorState.fromJSON({ schema }, state),
    _props: {
      dispatchTransaction: () => {}
    }
  };

  Object.assign(editorView, viewAttrs);

  return editorView;
};

forEach(message => {
  const { type, payload } = message;

  if (type === "init") {
    try {
      const editorView = initHandler(message);

      editorState = new EditorStateContainer(editorView, { EditorState });
      initialized = true;
      ReactDom.render(<DevToolsExtension />, document.getElementById("root"));
    } catch (e) {
      console.error("Could not initialize devtools from Editor!", e);
    }
  } else if (type === "updateState") {
    const { state } = payload;
    if (!initialized) {
      return;
    }
    const newState = EditorState.fromJSON({ schema }, state);
    editorState.pushNewState(newState);
  }
})(
  pipe(
    fromChromeRuntimeMessages(chrome),
    onlyFromExtension(),
    onlyOfType(["init", "updateState"])
    // tap(message => console.log(`Got Editor msg: ${JSON.stringify(message)}`))
  )
);
