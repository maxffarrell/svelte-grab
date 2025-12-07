export { init } from "./core.js";
export {
  getStack,
  getElementContext,
} from "./context.js";
export { generateSnippet } from "./utils/generate-snippet.js";
export { DEFAULT_THEME } from "./theme.js";
export type {
  Options,
  SvelteGrabAPI,
  Theme,
  SvelteGrabState,
  OverlayBounds,
  GrabbedBox,
  DragRect,
  Rect,
  DeepPartial,
  ElementLabelVariant,
  InputModeContext,
  CrosshairContext,
  ElementLabelContext,
  AgentContext,
  AgentSession,
  AgentProvider,
  AgentSessionStorage,
  AgentOptions,
} from "./types.js";

import { init } from "./core.js";
import type { SvelteGrabAPI } from "./types.js";

declare global {
  interface Window {
    __SVELTE_GRAB__?: SvelteGrabAPI;
  }
}

let globalApi: SvelteGrabAPI | null = null;

export const getGlobalApi = (): SvelteGrabAPI | null => {
  if (typeof window === "undefined") return globalApi;
  return window.__SVELTE_GRAB__ ?? globalApi ?? null;
};

export const setGlobalApi = (api: SvelteGrabAPI | null): void => {
  globalApi = api;
  if (typeof window !== "undefined") {
    if (api) {
      window.__SVELTE_GRAB__ = api;
    } else {
      delete window.__SVELTE_GRAB__;
    }
  }
};

if (typeof window !== "undefined") {
  if (window.__SVELTE_GRAB__) {
    globalApi = window.__SVELTE_GRAB__;
  } else {
    globalApi = init();
    window.__SVELTE_GRAB__ = globalApi;
    window.dispatchEvent(
      new CustomEvent("svelte-grab:init", { detail: globalApi }),
    );
  }
}