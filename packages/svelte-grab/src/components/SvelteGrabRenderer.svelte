<script lang="ts">
  import { onMount } from 'svelte';
  import SelectionBox from './SelectionBox.svelte';
  import type { 
    SvelteGrabRendererProps, 
    AgentSession, 
    OverlayBounds 
  } from '../types.js';

  // Props - these would be passed from a parent component
  export let selectionVisible: boolean = false;
  export let selectionBounds: OverlayBounds | null = null;
  export let selectionFilePath: string | undefined = undefined;
  export let selectionLineNumber: number | undefined = undefined;
  export let selectionTagName: string | undefined = undefined;
  export let selectionComponentName: string | undefined = undefined;
  export let selectionLabelVisible: boolean = false;
  export let selectionLabelStatus: string = "idle";
  export let labelInstances: any[] = [];
  export let dragVisible: boolean = false;
  export let dragBounds: OverlayBounds | null = null;
  export let grabbedBoxes: any[] = [];
  export let labelZIndex: number = 2147483647;
  export let mouseX: number = 0;
  export let mouseY: number = 0;
  export let crosshairVisible: boolean = false;
  export let inputValue: string = "";
  export let isInputExpanded: boolean = false;
  export let hasAgent: boolean = false;
  export let isAgentConnected: boolean = false;
  export let agentSessions: Map<string, AgentSession> = new Map();
  export let onAbortSession: ((sessionId: string) => void) | undefined = undefined;
  export let onInputChange: ((value: string) => void) | undefined = undefined;
  export let onInputSubmit: (() => void) | undefined = undefined;
  export let onInputCancel: (() => void) | undefined = undefined;
  export let onToggleExpand: (() => void) | undefined = undefined;
  export let isPendingDismiss: boolean = false;
  export let onConfirmDismiss: (() => void) | undefined = undefined;
  export let onCancelDismiss: (() => void) | undefined = undefined;
  export let nativeSelectionCursorVisible: boolean = false;
  export let nativeSelectionCursorX: number = 0;
  export let nativeSelectionCursorY: number = 0;
  export let nativeSelectionTagName: string | undefined = undefined;
  export let nativeSelectionComponentName: string | undefined = undefined;
  export let nativeSelectionBounds: OverlayBounds | null = null;
  export let onNativeSelectionCopy: (() => void) | undefined = undefined;
  export let onNativeSelectionEnter: (() => void) | undefined = undefined;
  export let theme: any = {};

  onMount(() => {
    // Component initialization if needed
  });

  // Convert Map to array for iteration
  $: agentSessionsList = Array.from(agentSessions.values());

  // Helper function to build open file URL
  function buildOpenFileUrl(filePath: string, lineNumber?: number) {
    if (!filePath) return "";
    return `${filePath}:${lineNumber || ""}`;
  }

  function handleOpenFile() {
    if (selectionFilePath) {
      const openFileUrl = buildOpenFileUrl(
        selectionFilePath,
        selectionLineNumber,
      );
      window.open(openFileUrl, "_blank");
    }
  }
</script>

<!-- Selection Box -->
{#if selectionVisible && selectionBounds}
  <SelectionBox
    variant="selection"
    bounds={selectionBounds}
    visible={selectionVisible}
    isFading={selectionLabelStatus === "fading"}
  />
{/if}

<!-- Crosshair -->
{#if crosshairVisible === true}
  <div class="crosshair" style="position: fixed; left: {mouseX}px; top: {mouseY}px; pointer-events: none; z-index: 2147483646;">
    <div style="width: 20px; height: 20px; border: 1px solid rgba(178, 28, 142, 0.8); border-radius: 50%;"></div>
  </div>
{/if}

<!-- Drag Box -->
{#if dragVisible && dragBounds}
  <SelectionBox
    variant="drag"
    bounds={dragBounds}
    visible={dragVisible}
  />
{/if}

<!-- Grabbed Boxes -->
{#each grabbedBoxes as box (box.id)}
  <SelectionBox
    variant="grabbed"
    bounds={box.bounds}
    createdAt={box.createdAt}
  />
{/each}

<!-- Agent Sessions -->
{#each agentSessionsList as session (session.id)}
  {#if session.selectionBounds}
    <SelectionBox
      variant="processing"
      bounds={session.selectionBounds}
      visible={true}
      isCompleted={!session.isStreaming}
    />
  {/if}
  
  <!-- Selection Label for Agent Session -->
  {#if session.selectionBounds}
    <div 
      class="selection-label agent" 
      style="position: fixed; z-index: {labelZIndex}; left: {session.position.x}px; top: {session.position.y}px;"
    >
      <div class="selection-label-content">
        <span class="tag">{session.tagName}</span>
        {#if session.componentName}
          <span class="component">{session.componentName}</span>
        {/if}
        <div class="status {session.isStreaming ? 'copying' : 'copied'}">
          {session.lastStatus || "Thinking…"}
        </div>
        {#if session.context.prompt}
          <div class="prompt">{session.context.prompt}</div>
        {/if}
        {#if onAbortSession}
          <button on:click={() => onAbortSession(session.id)} class="abort-button">
            Cancel
          </button>
        {/if}
      </div>
    </div>
  {/if}
{/each}

<!-- Selection Label -->
{#if selectionLabelVisible && selectionBounds}
  <div 
    class="selection-label" 
    class:expanded={isInputExpanded}
    class:has-agent={hasAgent}
    class:connected={isAgentConnected}
    style="position: fixed; z-index: {labelZIndex}; left: {mouseX}px; top: {mouseY}px;"
  >
    <div class="selection-label-content">
      <span class="tag">{selectionTagName}</span>
      {#if selectionComponentName}
        <span class="component">{selectionComponentName}</span>
      {/if}
      
      {#if hasAgent}
        <div class="agent-status">
          {isAgentConnected ? "Agent Connected" : "Agent Disconnected"}
        </div>
      {/if}
      
      <div class="status {selectionLabelStatus}">
        {#if selectionLabelStatus === "idle"}
          Click to grab element
        {:else if selectionLabelStatus === "copying"}
          Copying...
        {:else if selectionLabelStatus === "copied"}
          Copied!
        {:else if selectionLabelStatus === "fading"}
          Copied!
        {/if}
      </div>
      
      {#if selectionFilePath}
        <div class="file-info">
          <span class="file-path">{selectionFilePath}</span>
          {#if selectionLineNumber}
            <span class="line-number">:{selectionLineNumber}</span>
          {/if}
          <button on:click={handleOpenFile} class="open-button">
            Open
          </button>
        </div>
      {/if}
      
      {#if isInputExpanded && hasAgent}
        {#if inputValue !== undefined}
          <textarea 
            bind:value={inputValue}
            placeholder="Enter a prompt for the agent..."
            class="agent-input"
          ></textarea>
        {/if}
        <div class="input-actions">
          <button on:click={onInputSubmit} class="submit-button">
            Submit
          </button>
          <button on:click={onInputCancel} class="cancel-button">
            Cancel
          </button>
        </div>
      {/if}
      
      {#if isPendingDismiss}
        <div class="dismiss-confirm">
          <p>Are you sure you want to dismiss?</p>
          <button on:click={onConfirmDismiss} class="confirm-button">
            Yes
          </button>
          <button on:click={onCancelDismiss} class="cancel-dismiss-button">
            No
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Label Instances -->
{#each labelInstances as instance (instance.id)}
  <div 
    class="selection-label" 
    style="position: fixed; z-index: {labelZIndex}; left: {instance.mouseX}px; top: {instance.mouseY}px;"
  >
    <div class="selection-label-content">
      <span class="tag">{instance.tagName}</span>
      {#if instance.componentName}
        <span class="component">{instance.componentName}</span>
      {/if}
      <div class="status {instance.status}">
        {#if instance.status === "hover"}
          Hover
        {:else if instance.status === "processing"}
          Processing...
        {:else if instance.status === "success"}
          Success!
        {/if}
      </div>
    </div>
  </div>
{/each}

<!-- Native Selection Cursor -->
{#if nativeSelectionCursorVisible && nativeSelectionBounds}
  <div 
    class="selection-cursor"
    style="position: fixed; left: {nativeSelectionCursorX}px; top: {nativeSelectionCursorY}px;"
  >
    <div class="cursor-content">
      <span class="tag">{nativeSelectionTagName}</span>
      {#if nativeSelectionComponentName}
        <span class="component">{nativeSelectionComponentName}</span>
      {/if}
      <button on:click={onNativeSelectionCopy} class="copy-button">
        Copy
      </button>
      <button on:click={onNativeSelectionEnter} class="enter-button">
        Enter
      </button>
    </div>
  </div>
{/if}

<style>
  /* Selection Label Styles */
  .selection-label {
    position: fixed;
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px 12px;
    max-width: 300px;
    z-index: 2147483647;
    pointer-events: auto;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
  }
  
  .selection-label.expanded {
    max-width: 400px;
  }
  
  .selection-label-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .tag {
    display: inline-block;
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: #333;
  }
  
  .component {
    font-weight: 500;
    color: #666;
  }
  
  .status {
    font-size: 12px;
  }
  
  .status.copied {
    color: #00bb69;
    font-weight: 500;
  }
  
  .status.copying {
    color: #767676;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  
  .file-path {
    color: #767676;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  
  .line-number {
    color: #767676;
  }
  
  .open-button,
  .copy-button,
  .enter-button,
  .abort-button,
  .submit-button,
  .cancel-button,
  .confirm-button,
  .cancel-dismiss-button {
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
    margin-top: 4px;
  }
  
  .open-button:hover,
  .copy-button:hover,
  .enter-button:hover,
  .submit-button:hover,
  .confirm-button:hover {
    background-color: #e0e0e0;
  }
  
  .abort-button,
  .cancel-button,
  .cancel-dismiss-button {
    background-color: #f8f8f8;
  }
  
  .agent-status {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .selection-label.has-agent.connected .agent-status {
    background-color: #d9ffe4;
    color: #006e3b;
  }
  
  .selection-label.has-agent:not(.connected) .agent-status {
    background-color: #fff2cd;
    color: #856404;
  }
  
  .agent-input {
    width: 100%;
    min-height: 60px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    resize: vertical;
    font-family: inherit;
    font-size: 12px;
  }
  
  .input-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }
  
  .dismiss-confirm {
    background-color: #fff2cd;
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
  }
  
  .dismiss-confirm p {
    margin: 0 0 6px 0;
  }
  
  /* Selection Cursor Styles */
  .selection-cursor {
    position: fixed;
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 8px 12px;
    max-width: 300px;
    z-index: 2147483647;
    pointer-events: auto;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
  }
  
  .cursor-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .prompt {
    background-color: #f5f5f5;
    padding: 6px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 100px;
    overflow-y: auto;
  }
</style>