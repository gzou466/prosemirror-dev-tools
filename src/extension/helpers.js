import { filter, fromEvent, map, pipe } from "callbag-basics";

// seems to be a transpilation issue from Webpack... dirty fix!
const fixedFromEvent = fromEvent.default;

// helpers
export const randomId = () =>
  Math.random()
    .toString(16)
    .slice(2);

export const extensionSource = "prosemirror-devtools-bridge";

export function notifyTabs(chrome, message) {
  chrome.tabs.query({}, tabs =>
    tabs.forEach(tab => {
      try {
        chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        console.warn("could not notify tab", e);
      }
    })
  );
}

// callbags sources
export function fromWindowMessages(window) {
  return pipe(
    fixedFromEvent(window, "message"),
    filter(event => event.origin === window.origin),
    map(event => event.data)
  );
}

export function fromChromeRuntimeMessages(chrome) {
  return (start, sink) => {
    if (start !== 0) return;

    const listener = message => sink(1, message);
    const talkback = type => {
      if (type === 2) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    sink(0, talkback);
  };
}

// callbags operators
export function tap(tapFunction) {
  return source => (start, sink) => {
    if (start !== 0) return;
    source(0, (type, data) => {
      if (type === 1 && typeof tapFunction === "function" && !!data) {
        tapFunction(data);
      }
      sink(type, data);
    });
  };
}

export function mute() {
  return source => start => {
    if (start !== 0) return;
    source(0, () => null);
  };
}

export function onlyFromExtension() {
  return source => (start, sink) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
      }

      if (type === 1) {
        if (typeof data === "object" && data.source === extensionSource) {
          sink(type, data);
        } else {
          talkback(1);
        }
        return;
      }

      sink(type, data);
    });
  };
}

export function onlyOfType(types = []) {
  return source => (start, sink) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
      }

      if (type === 1) {
        if (typeof data === "object" && types.indexOf(data.type) !== -1) {
          sink(type, data);
        } else {
          talkback(1);
        }
        return;
      }

      sink(type, data);
    });
  };
}

// callbags sinks
export function repostWindowMessage(window) {
  let talkback;

  return source =>
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
      }

      if (type === 1) {
        window.postMessage(data, "*");
      }

      if (type === 0 || type === 1) {
        talkback(1);
      }
    });
}

export function repostChromeMessage(chrome) {
  const chromeExtensionId = chrome.runtime.id;
  let talkback;

  return source =>
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
      }

      if (type === 1 && typeof data === "object") {
        chrome.runtime.sendMessage(chromeExtensionId, data, {}, response => {
          if (!response && !!chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
          }
        });
      }

      if (type === 0 || type === 1) {
        talkback(1);
      }
    });
}
