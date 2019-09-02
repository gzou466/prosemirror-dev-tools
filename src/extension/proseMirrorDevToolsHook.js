import { filter, forEach, map, pipe } from "callbag-basics";
import { stringify } from "flatted/esm";

import {
  EXTENSION_SOURCE,
  fromWindowMessages,
  onlyFromExtension,
  randomId
} from "./helpers";

const editorViews = {};
// const listeners = {};

const hook = {
  extensionShowing: false,

  inject(editorView) {
    const editorId = randomId();

    editorViews[editorId] = editorView;

    // init phase
    const { doc, plugins, schema } = editorView.state;

    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "init",
        payload: {
          schemaAsJSON: stringify(schema),
          docAsJSON: stringify(doc),
          pluginsStateAsJSON: stringify(plugins)
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
              stateAsJSON: stringify(state)
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
