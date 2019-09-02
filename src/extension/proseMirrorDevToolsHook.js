import { filter, forEach, map, pipe } from "callbag-basics";

import {
  EXTENSION_SOURCE,
  fromWindowMessages,
  onlyFromExtension,
  randomId
} from "./helpers";

const editorViews = {};

const cloneObj = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const hook = {
  extensionShowing: false,

  inject(editorView) {
    const editorId = randomId();

    editorViews[editorId] = editorView;

    const schemaSpec = cloneObj(editorView.state.schema.spec);

    const {
      composing,
      composingTimeout,
      compositionEndedAt,
      cursorWrapper,
      domChangeCount,
      dragging,
      editable,
      focused,
      lastClick,
      lastKeyCode,
      lastKeyCodeTime,
      lastSelectedViewDesc,
      lastSelectionOrigin,
      lastSelectionTime,
      mounted,
      mouseDown,
      shiftKey
    } = editorView;

    const viewAttrs = {
      composing,
      composingTimeout,
      compositionEndedAt,
      cursorWrapper,
      domChangeCount,
      dragging,
      editable,
      focused,
      lastClick,
      lastKeyCode,
      lastKeyCodeTime,
      lastSelectedViewDesc,
      lastSelectionOrigin,
      lastSelectionTime,
      mounted,
      mouseDown,
      shiftKey
    };

    console.log(
      editorView.state.plugins[1].getState(editorView.state),
      23333333
    );

    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "init",
        payload: {
          viewAttrs,
          state: editorView.state.toJSON(),
          schemaSpec
        }
      },
      "*"
    );

    return {
      updateState(state) {
        window.postMessage(
          {
            source: EXTENSION_SOURCE,
            type: "updateState",
            payload: {
              state: state.toJSON()
            }
          },
          "*"
        );
      },
      disconnect() {
        editorViews[editorId] = undefined;
      }
    };
  }

  // on(event: string, fn) {
  //   if (!listeners[event]) {
  //     listeners[event] = [];
  //   }
  //   listeners[event].push(fn);
  //   return () => hook.off(event, fn);
  // },

  // off(event: string, fn) {
  //   if (!listeners[event]) {
  //     return;
  //   }

  //   const ix = listeners[event].indexOf(fn);
  //   if (ix !== -1) {
  //     listeners[event].splice(ix, 1);
  //   }
  //   if (!listeners[event].length) {
  //     listeners[event] = null;
  //   }
  // },

  // emit(event: string, data: any) {
  //   if (listeners[event]) {
  //     listeners[event].map(fn => fn(data));
  //   }
  // }
};

if (!(typeof window.__FABRIC_EDITOR_DEVTOOLS_GLOBAL_HOOK__ === "object")) {
  Object.defineProperty(window, "__FABRIC_EDITOR_DEVTOOLS_GLOBAL_HOOK__", {
    value: hook,
    writable: false
  });
}

// dynamically update extensionShowing flag
forEach(
  showing =>
    (global.__FABRIC_EDITOR_DEVTOOLS_GLOBAL_HOOK__.extensionShowing = showing)
)(
  pipe(
    fromWindowMessages(window),
    onlyFromExtension(),
    filter(message => message.type === "extension-showing"),
    map(message => message.payload)
  )
);
