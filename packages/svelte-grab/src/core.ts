// @ts-expect-error - CSS imported as text via tsup loader
import cssText from "./styles.css";
import { writable, derived, get } from "svelte/store";
import { onDestroy, onMount } from "svelte";
import { isKeyboardEventTriggeredByInput } from "./utils/is-keyboard-event-triggered-by-input.js";
import { isSelectionInsideEditableElement } from "./utils/is-selection-inside-editable-element.js";
import { mountRoot } from "./utils/mount-root-svelte.js";
import { getElementContext, getStack, getNearestComponentName } from "./context.js";
import { generateSnippet } from "./utils/generate-snippet.js";
import { isSourceFile, normalizeFileName } from "bippy/source";
import { copyContent } from "./utils/copy-content.js";
import { getElementAtPosition } from "./utils/get-element-at-position.js";
import { isValidGrabbableElement } from "./utils/is-valid-grabbable-element.js";
import { getElementsInDrag, getElementsInDragLoose } from "./utils/get-elements-in-drag.js";
import { createElementBounds } from "./utils/create-element-bounds.js";
import { stripTranslateFromTransform } from "./utils/strip-translate-from-transform.js";
import { createSession, updateSession } from "./utils/agent-session.js";
import {
  SUCCESS_LABEL_DURATION_MS,
  COPIED_LABEL_DURATION_MS,
  OFFSCREEN_POSITION,
  DRAG_THRESHOLD_PX,
  ELEMENT_DETECTION_THROTTLE_MS,
  Z_INDEX_LABEL,
  AUTO_SCROLL_EDGE_THRESHOLD_PX,
  AUTO_SCROLL_SPEED_PX,
  LOGO_SVG,
  MODIFIER_KEYS,
  BLUR_DEACTIVATION_THRESHOLD_MS,
  BOUNDS_RECALC_INTERVAL_MS,
} from "./constants.js";
import { isCLikeKey } from "./utils/is-c-like-key.js";
import { keyMatchesCode, isTargetKeyCombination } from "./utils/hotkey.js";
import { isEventFromOverlay } from "./utils/is-event-from-overlay.js";
import { buildOpenFileUrl } from "./utils/build-open-file-url.js";
import { ATTRIBUTE_NAME } from "./utils/mount-root-svelte.js";
import type {
  Options,
  OverlayBounds,
  GrabbedBox,
  SvelteGrabAPI,
  SvelteGrabState,
  DeepPartial,
  Theme,
  SelectionLabelStatus,
  SelectionLabelInstance,
  AgentSession,
  AgentOptions,
} from "./types.js";
import { mergeTheme, deepMergeTheme } from "./theme.js";
import { createAgentManager } from "./agent.js";

// Create Svelte stores for state management
export const svelteGrabState = writable<SvelteGrabState>({
  isActive: false,
  isDragging: false,
  isCopying: false,
  isInputMode: false,
  targetElement: null,
  dragBounds: null,
});

export const selectionVisible = writable(false);
export const selectionBounds = writable<OverlayBounds | null>(null);
export const dragVisible = writable(false);
export const dragBounds = writable<OverlayBounds | null>(null);
export const grabbedBoxes = writable<GrabbedBox[]>([]);
export const crosshairVisible = writable(false);
export const mouseX = writable<number>(0);
export const mouseY = writable<number>(0);
export const selectionLabelVisible = writable(false);
export const selectionLabelStatus = writable<SelectionLabelStatus>("idle");
export const inputValue = writable("");
export const isInputExpanded = writable(false);
export const agentSessions = writable<Map<string, AgentSession>>(new Map());

const onIdle = (callback: () => void) => {
  if ("scheduler" in globalThis) {
    return (
      globalThis as unknown as {
        scheduler: {
          postTask: (cb: () => void, opts: { priority: string }) => void;
        };
      }
    ).scheduler.postTask(callback, {
      priority: "background",
    });
  }
  if ("requestIdleCallback" in window) {
    return requestIdleCallback(callback);
  }
  return setTimeout(callback, 0);
};

let hasInited = false;

const getScriptOptions = (): Partial<Options> | null => {
  if (typeof window === "undefined") return null;
  try {
    const dataOptions = document.currentScript?.getAttribute("data-options");
    if (!dataOptions) return null;
    return JSON.parse(dataOptions) as Partial<Options>;
  } catch {
    return null;
  }
};

export const init = (rawOptions?: Options): SvelteGrabAPI => {
  const initialTheme = mergeTheme(rawOptions?.theme);

  if (typeof window === "undefined") {
    return {} as SvelteGrabAPI;
  }

  if (hasInited) {
    console.warn("Svelte Grab has already been initialized");
    return {} as SvelteGrabAPI;
  }

  hasInited = true;

  // Merge options from script tag and passed options
  const scriptOptions = getScriptOptions();
  const options: Required<Options> = {
    enabled: true,
    keyHoldDuration: 300,
    allowActivationInsideInput: false,
    maxContextLines: 0,
    theme: initialTheme,
    activationShortcut: () => false,
    activationKey: {
      key: "g",
      metaKey: true,
    },
    onActivate: () => {},
    onDeactivate: () => {},
    onElementHover: () => {},
    onElementSelect: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
    onBeforeCopy: () => {},
    onAfterCopy: () => {},
    onCopySuccess: () => {},
    onCopyError: () => {},
    onStateChange: () => {},
    onInputModeChange: () => {},
    onSelectionBox: () => {},
    onDragBox: () => {},
    onGrabbedBox: () => {},
    onElementLabel: () => {},
    onCrosshair: () => {},
    onOpenFile: () => {},
    agent: undefined as unknown as AgentOptions,
    ...scriptOptions,
    ...rawOptions,
  };

  // Create mutable references for values that change frequently
  let lastKeyActivationTime = 0;
  let currentKeyHoldStartTime = 0;
  let currentDragStartPosition: { x: number; y: number } | null = null;
  let currentDragEndPosition: { x: number; y: number } | null = null;
  let currentTargetElement: Element | null = null;
  let currentSelectionBounds: OverlayBounds | null = null;
  let blurTimeoutId: number | null = null;

  // Get the current state
  const getState = (): SvelteGrabState => {
    return get(svelteGrabState);
  };

  // Update state and trigger callbacks
  const updateState = (updates: Partial<SvelteGrabState>) => {
    svelteGrabState.update((current) => {
      const newState = { ...current, ...updates };
      options.onStateChange(newState);
      return newState;
    });
  };

  // Agent manager
  const agentManager = createAgentManager(options.agent, {
    onStatus: (status: string, session: AgentSession) => {
      agentSessions.update((sessions) => {
        const newSessions = new Map(sessions);
        const existingSession = newSessions.get(session.id);
        if (existingSession) {
          newSessions.set(session.id, { ...existingSession, lastStatus: status });
        }
        return newSessions;
      });
      options.agent?.onStatus?.(status, session);
    },
    onStreamStart: (session: AgentSession) => {
      agentSessions.update((sessions) => {
        const newSessions = new Map(sessions);
        newSessions.set(session.id, { ...session, isStreaming: true });
        return newSessions;
      });
      options.agent?.onStart?.(session, session.context.content as any);
    },
    onStreamEnd: (session: AgentSession) => {
      agentSessions.update((sessions) => {
        const newSessions = new Map(sessions);
        newSessions.set(session.id, { ...session, isStreaming: false });
        return newSessions;
      });
      options.agent?.onComplete?.(session, session.context.content as any);
    },
    onError: (error: Error, session: AgentSession) => {
      options.agent?.onError?.(error, session);
    },
    onAbort: (session: AgentSession) => {
      agentSessions.update((sessions) => {
        const newSessions = new Map(sessions);
        newSessions.delete(session.id);
        return newSessions;
      });
      options.agent?.onAbort?.(session, session.context.content as any);
    },
  });

  // Theme management
  const theme = writable<Required<Theme>>(initialTheme);

  const updateTheme = (themeUpdates: DeepPartial<Theme>) => {
    theme.update((current) => deepMergeTheme(current, themeUpdates));
  };

  // Activate the grab functionality
  const activate = () => {
    if (getState().isActive) return;
    updateState({ isActive: true });
    options.onActivate();
  };

  // Deactivate the grab functionality
  const deactivate = () => {
    if (!getState().isActive) return;
    updateState({ isActive: false });
    options.onDeactivate();
  };

  // Toggle activation
  const toggle = () => {
    if (getState().isActive) {
      deactivate();
    } else {
      activate();
    }
  };

  // Check if active
  const isActive = () => getState().isActive;

  // Copy element(s)
  const copyElement = async (elements: Element | Element[]): Promise<boolean> => {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    if (elementArray.length === 0) return false;

    updateState({ isCopying: true });

    try {
      await options.onBeforeCopy?.(elementArray);
      
      const content = await generateSnippet(elementArray, { maxLines: Infinity });
      const success = content.length > 0;
      
      if (content) {
        // Copy content to clipboard
        navigator.clipboard.writeText(content).then(() => {
          console.log('Element context copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy content: ', err);
        });
      }
      
      await options.onAfterCopy?.(elementArray, success);
      
      if (success) {
        elementArray.forEach((element) => {
          const bounds = createElementBounds(element);
          if (bounds) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            grabbedBoxes.update((boxes) => [
              ...boxes,
              {
                id,
                bounds,
                createdAt: Date.now(),
                element,
              },
            ]);
            options.onGrabbedBox?.(bounds, element);
          }
        });
      }
      
      return content ? true : false;
    } catch (error) {
      options.onCopyError?.(error as Error);
      return false;
    } finally {
      updateState({ isCopying: false });
    }
  };

  // Dispose
  const dispose = () => {
    deactivate();
    agentManager.dispose?.();
  };

  // Create overlay root
  const { root, host, dispose: disposeRoot } = mountRoot(cssText);

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = cssText;
  document.head.appendChild(style);

  // Set up keyboard event listeners
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!options.enabled || !getState().isActive) return;
    if (isKeyboardEventTriggeredByInput(event) && !options.allowActivationInsideInput) return;
    
    if (options.activationShortcut ? options.activationShortcut(event) : isTargetKeyCombination(event, { activationKey: options.activationKey })) {
      if (!currentKeyHoldStartTime) {
        currentKeyHoldStartTime = Date.now();
      }
      return;
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!options.enabled || !getState().isActive) return;
    if (isKeyboardEventTriggeredByInput(event) && !options.allowActivationInsideInput) return;
    
    if (options.activationShortcut ? options.activationShortcut(event) : isTargetKeyCombination(event, { activationKey: options.activationKey })) {
      const keyHoldDuration = Date.now() - (currentKeyHoldStartTime || Date.now());
      currentKeyHoldStartTime = 0;
      
      if (keyHoldDuration >= options.keyHoldDuration) {
        toggle();
      }
      return;
    }
  };

  // Mouse event handlers
  const handleMouseMove = (event: MouseEvent) => {
    if (!getState().isActive) return;
    
    mouseX.set(event.clientX);
    mouseY.set(event.clientY);
    
    if (isEventFromOverlay(event, ATTRIBUTE_NAME)) return;
    
    const element = getElementAtPosition(event.clientX, event.clientY);
    if (element !== currentTargetElement) {
      currentTargetElement = element;
      options.onElementHover?.(element || document.body);
    }
    
    if (element && isValidGrabbableElement(element)) {
      const bounds = createElementBounds(element);
      if (bounds) {
        currentSelectionBounds = bounds;
        selectionBounds.set(bounds);
        selectionVisible.set(true);
        options.onSelectionBox?.(true, bounds, element);
      }
    } else {
      currentSelectionBounds = null;
      selectionVisible.set(false);
      options.onSelectionBox?.(false, null, null);
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!getState().isActive || isEventFromOverlay(event, ATTRIBUTE_NAME)) return;
    
    if (event.button === 0 && currentTargetElement && isValidGrabbableElement(currentTargetElement)) {
      currentDragStartPosition = { x: event.clientX, y: event.clientY };
      updateState({ isDragging: true });
      dragVisible.set(false);
      options.onDragStart?.(event.clientX, event.clientY);
    }
  };

  const handleMouseUp = async (event: MouseEvent) => {
    if (!getState().isActive || !getState().isDragging) return;
    
    currentDragEndPosition = { x: event.clientX, y: event.clientY };
    
    updateState({ isDragging: false });
    
    if (currentDragStartPosition && currentDragEndPosition) {
      const dx = currentDragEndPosition.x - currentDragStartPosition.x;
      const dy = currentDragEndPosition.y - currentDragStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= DRAG_THRESHOLD_PX) {
        // This was a drag, select multiple elements
        const elements = getElementsInDrag(
          {
            x: Math.min(currentDragStartPosition.x, currentDragEndPosition.x),
            y: Math.min(currentDragStartPosition.y, currentDragEndPosition.y),
            width: Math.abs(dx),
            height: Math.abs(dy),
          },
          isValidGrabbableElement,
        );
        
        if (elements.length > 0) {
          await copyElement(elements);
          const rect = {
            x: Math.min(currentDragStartPosition.x, currentDragEndPosition.x),
            y: Math.min(currentDragStartPosition.y, currentDragEndPosition.y),
            width: Math.abs(dx),
            height: Math.abs(dy),
          };
          options.onDragEnd?.(elements, rect);
        }
      } else if (currentTargetElement) {
        // This was a click, select single element
        await copyElement(currentTargetElement);
      }
    }
    
    dragVisible.set(false);
    currentDragStartPosition = null;
    currentDragEndPosition = null;
  };

  // Blur handling
  const handleBlur = () => {
    if (!getState().isActive) return;
    
    blurTimeoutId = window.setTimeout(() => {
      deactivate();
    }, BLUR_DEACTIVATION_THRESHOLD_MS);
  };

  const handleFocus = () => {
    if (blurTimeoutId !== null) {
      clearTimeout(blurTimeoutId);
      blurTimeoutId = null;
    }
  };

  // Add event listeners
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("blur", handleBlur);
  document.addEventListener("focus", handleFocus);

  // Cleanup function
  const cleanup = () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("blur", handleBlur);
    document.removeEventListener("focus", handleFocus);
    document.head.removeChild(style);
    disposeRoot();
  };

  // Store cleanup function for later use
  let isDisposed = false;
  const enhancedDispose = () => {
    if (isDisposed) return;
    isDisposed = true;
    dispose();
    cleanup();
  };

  // Return the API
  return {
    activate,
    deactivate,
    toggle,
    isActive,
    dispose: enhancedDispose,
    copyElement,
    getState,
    updateTheme,
    getTheme: () => get(theme),
    setAgent: (agentOptions: AgentOptions) => {
      agentManager.update(agentOptions);
    },
  };
};