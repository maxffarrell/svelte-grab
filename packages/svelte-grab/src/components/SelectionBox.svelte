<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { lerp } from '../utils/lerp.js';
  import { cn } from '../utils/cn.js';
  import { SELECTION_LERP_FACTOR } from '../constants.js';
  import type { OverlayBounds } from '../types.js';

  export let variant: "selection" | "grabbed" | "drag" | "processing";
  export let bounds: OverlayBounds;
  export let visible: boolean = true;
  export let lerpFactor: number = undefined;
  export let createdAt: number = undefined;
  export let isFading: boolean = false;
  export let isCompleted: boolean = false;

  // Reactive values for animation
  let currentX: number = bounds.x;
  let currentY: number = bounds.y;
  let currentWidth: number = bounds.width;
  let currentHeight: number = bounds.height;
  let opacity: number = 1;

  let animationFrameId: number | null = null;
  let fadeTimerId: number | null = null;
  let targetBounds = bounds;
  let isAnimating = false;

  const getLerpFactor = () => {
    if (lerpFactor !== undefined) return lerpFactor;
    if (variant === "drag") return 0.7;
    return SELECTION_LERP_FACTOR;
  };

  const startAnimation = () => {
    if (isAnimating) return;
    isAnimating = true;

    const animate = () => {
      const interpolatedX = lerp(currentX, targetBounds.x, getLerpFactor());
      const interpolatedY = lerp(currentY, targetBounds.y, getLerpFactor());
      const interpolatedWidth = lerp(
        currentWidth,
        targetBounds.width,
        getLerpFactor(),
      );
      const interpolatedHeight = lerp(
        currentHeight,
        targetBounds.height,
        getLerpFactor(),
      );

      currentX = interpolatedX;
      currentY = interpolatedY;
      currentWidth = interpolatedWidth;
      currentHeight = interpolatedHeight;

      const hasConvergedToTarget =
        Math.abs(interpolatedX - targetBounds.x) < 0.5 &&
        Math.abs(interpolatedY - targetBounds.y) < 0.5 &&
        Math.abs(interpolatedWidth - targetBounds.width) < 0.5 &&
        Math.abs(interpolatedHeight - targetBounds.height) < 0.5;

      if (!hasConvergedToTarget) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
        isAnimating = false;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
  };

  // Initialize values on mount
  onMount(() => {
    currentX = bounds.x;
    currentY = bounds.y;
    currentWidth = bounds.width;
    currentHeight = bounds.height;
  });

  // Handle bounds changes
  $: if (bounds) {
    targetBounds = bounds;
    startAnimation();
  }

  // Handle fade timer for grabbed boxes
  $: if (variant === "grabbed" && createdAt) {
    fadeTimerId = window.setTimeout(() => {
      opacity = 0;
    }, 1500);
  }

  // Clean up
  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (fadeTimerId !== null) {
      window.clearTimeout(fadeTimerId);
      fadeTimerId = null;
    }
    isAnimating = false;
  });

  // Reactive class and style values
  $: className = cn(
    "fixed box-border",
    variant === "drag" && "pointer-events-none",
    variant !== "drag" && "pointer-events-auto",
    variant === "grabbed" && "z-2147483645",
    variant !== "grabbed" && "z-2147483646",
    variant === "drag" &&
      "border border-solid border-grab-purple/40 bg-grab-purple/5 will-change-[transform,width,height] cursor-crosshair",
    variant === "selection" &&
      "border border-solid border-grab-purple/50 bg-grab-purple/8 transition-opacity duration-100 ease-out",
    variant === "grabbed" && "border border-solid border-grab-purple/50 bg-grab-purple/8",
    variant === "processing" &&
      !isCompleted &&
      "border border-solid border-grab-purple/50 bg-grab-purple/8",
    variant === "processing" &&
      isCompleted &&
      "border border-solid border-grab-purple/50 bg-grab-purple/8",
  );

  $: style = `
    top: ${currentY}px;
    left: ${currentX}px;
    width: ${currentWidth}px;
    height: ${currentHeight}px;
    border-radius: ${bounds.borderRadius};
    transform: ${bounds.transform};
    opacity: ${isFading ? 0 : opacity};
    contain: ${variant === "drag" ? "layout paint size" : undefined};
    overflow: visible;
  `;
</script>

{#if visible}
  <div class={className} style={style}></div>
{/if}