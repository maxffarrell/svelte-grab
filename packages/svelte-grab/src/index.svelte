<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { init, type SvelteGrabAPI } from './index.js';
  import SvelteGrabRenderer from './components/SvelteGrabRenderer.svelte';
  
  // API reference
  let svelteGrabAPI: SvelteGrabAPI | null = null;
  
  // Reactive state for renderer
  let selectionVisible = false;
  let selectionBounds = null;
  let selectionLabelVisible = false;
  let selectionLabelStatus = "idle";
  let mouseX = 0;
  let mouseY = 0;
  let crosshairVisible = false;
  let dragVisible = false;
  let dragBounds = null;
  let grabbedBoxes = [];
  let agentSessions = new Map();
  
  onMount(() => {
    // Initialize Svelte Grab
    svelteGrabAPI = init({
      enabled: true,
      activationKey: {
        key: "g",
        metaKey: true, // Cmd key on Mac
      },
      onElementHover: (element) => {
        console.log('Hovering over:', element);
      },
      onElementSelect: (element) => {
        console.log('Selected:', element);
      },
      onStateChange: (state) => {
        console.log('State changed:', state);
      },
      // Add your custom callbacks here
    });
    
    // Store reference globally
    if (typeof window !== 'undefined') {
      window.__SVELTE_GRAB__ = svelteGrabAPI;
    }
  });
  
  onDestroy(() => {
    if (svelteGrabAPI) {
      svelteGrabAPI.dispose();
    }
  });
</script>

<SvelteGrabRenderer
  {selectionVisible}
  {selectionBounds}
  {selectionLabelVisible}
  {selectionLabelStatus}
  {mouseX}
  {mouseY}
  {crosshairVisible}
  {dragVisible}
  {dragBounds}
  {grabbedBoxes}
  {agentSessions}
/>

<!-- You can add additional UI here to control Svelte Grab -->
<div class="svelte-grab-controls">
  <button on:click={() => svelteGrabAPI?.activate()}>
    Activate Svelte Grab
  </button>
  <button on:click={() => svelteGrabAPI?.deactivate()}>
    Deactivate Svelte Grab
  </button>
  <button on:click={() => svelteGrabAPI?.toggle()}>
    Toggle Svelte Grab
  </button>
</div>

<style>
  .svelte-grab-controls {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 8px;
    z-index: 1000;
  }
  
  .svelte-grab-controls button {
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .svelte-grab-controls button:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
</style>