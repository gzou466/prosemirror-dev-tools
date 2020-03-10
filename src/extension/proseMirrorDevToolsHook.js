import { filter, forEach, map, pipe } from "callbag-basics";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  PROSEMIRROR_DEVTOOLS_CONTENT,
  PROSEMIRROR_DEVTOOLS_BACKGROUND,
  NOTIFY_DEV_PANEL_VISIBILITY
} from "./constants";
import rafSchd from "raf-schd";

import { fromWindowMessages, randomId } from "./helpers";

const proseMirrorSelector = ".ProseMirror";
let currentProseMirrorNode = null;
let currentProseMirrorNodeId = "";
let currentSchemaSpecStr = "";

const getSchemaSpecStr = proseMirrorNode => {
  if (proseMirrorNode && proseMirrorNode.pmViewDesc) {
    return JSON.stringify(proseMirrorNode.pmViewDesc.node.type.schema.spec);
  }
  return "";
};

const updateCurrentProseMirrorNode = proseMirrorNode => {
  currentProseMirrorNode = proseMirrorNode;
  currentProseMirrorNodeId = randomId();
  currentSchemaSpecStr = getSchemaSpecStr(proseMirrorNode);
};

const getCurrentProseMirrorNode = () => {
  if (
    document.getSelection().anchorNode &&
    document.getSelection().anchorNode.pmViewDesc &&
    document.getSelection().anchorNode.parentElement
  ) {
    const closestProseMirrorNode = document
      .getSelection()
      .anchorNode.parentElement.closest(proseMirrorSelector);
    if (
      closestProseMirrorNode &&
      closestProseMirrorNode.pmViewDesc &&
      currentProseMirrorNode !== closestProseMirrorNode
    ) {
      updateCurrentProseMirrorNode(closestProseMirrorNode);
      clearMutationObserver();
      startObserving(currentProseMirrorNode);
    }
  } else if (!currentProseMirrorNode) {
    updateCurrentProseMirrorNode(document.querySelector(proseMirrorSelector));
  }
  return currentProseMirrorNode;
};

const getState = proseMirrorNode => {
  const pmViewDesc = proseMirrorNode.pmViewDesc;
  const state = EditorState.create({
    doc: pmViewDesc.node
  });

  if (
    document.getSelection().anchorNode &&
    document.getSelection().anchorNode.pmViewDesc
  ) {
    const $start = state.tr.doc.resolve(
      document.getSelection().anchorNode.pmViewDesc.posBefore +
        document.getSelection().anchorOffset
    );
    const $end = state.tr.doc.resolve(
      document.getSelection().anchorNode.pmViewDesc.posBefore +
        document.getSelection().focusOffset
    );

    const selection = new TextSelection($start, $end);
    try {
      const newState = state.apply(state.tr.setSelection(selection));
      return newState;
    } catch (e) {
      return state;
    }
  }

  return state;
};

const updateState = rafSchd(() => {
  console.log("updateState");

  const proseMirrorNode = getCurrentProseMirrorNode();
  if (proseMirrorNode) {
    try {
      window.postMessage(
        {
          source: PROSEMIRROR_DEVTOOLS_CONTENT,
          type: "updateState",
          payload: {
            state: getState(proseMirrorNode).toJSON(),
            schemaStr: currentSchemaSpecStr,
            editorId: currentProseMirrorNodeId
          }
        },
        "*"
      );
    } catch (e) {
      // console.error(e);
      // TODO: we should not need this.
    }
  }
});

const updateStateFunc = () => {
  updateState();
};

const pmNodeObserver = new MutationObserver(() => updateState());

const clearMutationObserver = () => {
  updateState.cancel();
  pmNodeObserver.disconnect();
  pmNodeObserver.takeRecords();
  document.removeEventListener("selectionchange", updateStateFunc);
};

const startObserving = element => {
  pmNodeObserver.observe(element, {
    attributes: false,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: false,
    characterDataOldValue: true
  });
  document.addEventListener("selectionchange", updateStateFunc);
};

const initHook = () => {
  clearMutationObserver();
  const proseMirrorNode = getCurrentProseMirrorNode();
  if (proseMirrorNode && proseMirrorNode.pmViewDesc) {
    updateState();
    startObserving(currentProseMirrorNode);
  }
};

const setupHook = () => {
  if (
    document.querySelector(proseMirrorSelector) &&
    document.querySelector(proseMirrorSelector).pmViewDesc
  ) {
    initHook();
  } else {
    const bodyObserver = new MutationObserver(() => {
      if (
        document.querySelector(proseMirrorSelector) &&
        document.querySelector(proseMirrorSelector).pmViewDesc
      ) {
        initHook();
        bodyObserver.disconnect();
        bodyObserver.takeRecords();
      }
    });

    bodyObserver.observe(document.body, {
      attributes: false,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: false,
      characterDataOldValue: true
    });
  }
};

// function pmDevToolsMessagesHandler({ data }) {
//   if (
//     data &&
//     typeof data === "object" &&
//     data.source === PROSEMIRROR_DEVTOOLS_BACKGROUND
//   ) {
//     if (data.type === NOTIFY_DEV_PANEL_VISIBILITY) {
//       if (data.data.visibility) {
//         setupHook();
//       } else if (isHookInitialized) {
//         clearMutationObserver();
//       }
//     }
//   }
// }

// window.addEventListener("message", pmDevToolsMessagesHandler);

// document.addEventListener("visibilitychange", function() {
//   if (document.hidden) {
//     clearMutationObserver();
//   } else {
//     setupHook();
//   }
// });

// dynamically update extensionShowing flag
forEach(visibility => {
  if (visibility) {
    setupHook();
  } else {
    clearMutationObserver();
  }
})(
  pipe(
    fromWindowMessages(window),
    filter(message => message && typeof message === "object"),
    filter(message => message.source === PROSEMIRROR_DEVTOOLS_BACKGROUND),
    filter(message => message.type === NOTIFY_DEV_PANEL_VISIBILITY),
    map(message => message.data.visibility)
  )
);
