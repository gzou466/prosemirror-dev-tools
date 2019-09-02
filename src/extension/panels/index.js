/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import * as React from "react";
import * as ReactDom from "react-dom";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Provider } from "unstated";
import { forEach, pipe } from "callbag-basics";
import { parse } from "flatted/esm";

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

function DevToolsExtension() {
  return (
    <Provider inject={[globalState, editorState]}>
      <DevTools />
    </Provider>
  );
}

function patchSchema(schema) {
  // ?

  return schema;
}

function patchDocument(schema, document) {
  document.schema = schema;
  // ?

  return document;
}

function patchState(schema, editorState) {
  editorState.schema = schema;
  // ?

  return editorState;
}

forEach(message => {
  const { type, payload } = message;
  let schema;
  let initialized = false;

  if (type === "init") {
    debugger;
    const { schemaAsJSON, docAsJSON, pluginsStateAsJSON } = payload;

    schema = patchSchema(parse(schemaAsJSON));
    const initialDoc = patchDocument(schema, parse(docAsJSON));

    try {
      const editorView = new EditorView(undefined, {
        state: EditorState.create({
          schema: new Schema({
            nodes: schema.spec.nodes,
            marks: schema.spec.marks
          }),
          doc: initialDoc
        })
      });

      editorState = new EditorStateContainer(editorView, { EditorState });

      ReactDom.render(<DevToolsExtension />, document.getElementById("root"));
      initialized = true;
    } catch (e) {
      console.error("Could not initialize devtools from Editor!", e);
    }
  }

  if (type === "updateState") {
    debugger;
    const { stateAsJSON } = payload;

    if (!initialized) {
      return;
    }

    const newState = patchState(schema, parse(stateAsJSON));

    editorState.pushNewState(newState);
  }
})(
  pipe(
    fromChromeRuntimeMessages(chrome),
    onlyFromExtension(),
    onlyOfType(["init", "updateState"]),
    tap(message => console.log(`Got Editor msg: ${JSON.stringify(message)}`))
  )
);
