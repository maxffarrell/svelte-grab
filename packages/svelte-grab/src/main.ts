import { init } from './index.js';

// Initialize with default options
const api = init({
  theme: {
    enabled: true,
    hue: 0,
    selectionBox: {
      enabled: true,
    },
    dragBox: {
      enabled: true,
    },
    grabbedBoxes: {
      enabled: true,
    },
    elementLabel: {
      enabled: true,
    },
    crosshair: {
      enabled: true,
    },
  },
  onElementSelect: (element) => {
    console.log("Selected:", element);
  },
  onCopySuccess: (elements, content) => {
    console.log("Copied to clipboard:", content);
  },
  onStateChange: (state) => {
    console.log("State:", state);
  },
});

// Expose API globally for debugging
if (typeof window !== "undefined") {
  (window as any).svelteGrabAPI = api;
}