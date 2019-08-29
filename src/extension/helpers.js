import { filter, fromEvent, map, pipe, tap } from "callbag-basics";

export const randomId = () =>
  Math.random()
    .toString(16)
    .slice(2);

const validMessageTypes = ["init", "updateState", "extension"];

export const messageOfCorrectType = message =>
  !!message && validMessageTypes.indexOf(message.type) !== -1;

export function notifyTabs(chrome, message) {
  chrome.tabs.query({}, tabs =>
    tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, message))
  );
}

export function fromWindowMessages(window) {
  return pipe(
    fromEvent(window, "message"),
    filter(event => event.origin === window.origin),
    map(event => event.data),
    tap(message => console.log(`Got message: ${message}`))
  );
}
