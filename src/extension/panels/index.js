/* eslint-disable no-undef */

import * as React from "react";
import * as ReactDom from "react-dom";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema as schemaBasic } from "prosemirror-schema-basic";
import { Provider } from "unstated";

import { messageOfCorrectType } from "../helpers";
import DevTools from "../../dev-tools-extension";
import EditorStateContainer from "../../state/editor";
import GlobalStateContainer from "../../state/global";

const editorView = new EditorView(undefined, {
  state: EditorState.create({
    schema: new Schema({
      nodes: schemaBasic.spec.nodes,
      marks: schemaBasic.spec.marks
    })
  })
});

const globalState = new GlobalStateContainer({ opened: true, defaultSize: 1 });
const editorState = new EditorStateContainer(editorView, { EditorState });

class DevToolsExtension extends React.Component {
  componentDidMount() {
    globalState.toggleDevTools();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!messageOfCorrectType(message)) {
        return;
      }

      console.log(`Got Message: ${JSON.stringify(message)}`);

      sendResponse({ success: true });
      return true; // async
    });
  }

  render() {
    return (
      <Provider inject={[globalState, editorState]}>
        <DevTools />
      </Provider>
    );
  }
}

ReactDom.render(<DevToolsExtension />, document.getElementById("root"));
