export const ATTRIBUTE_NAME = "data-svelte-grab";

export interface MountRootResult {
  root: HTMLDivElement;
  host: HTMLDivElement;
  dispose: () => void;
}

export const mountRoot = (cssText?: string): MountRootResult => {
  const mountedHost = document.querySelector(`[${ATTRIBUTE_NAME}]`);
  if (mountedHost) {
    const mountedRoot = mountedHost.shadowRoot?.querySelector(
      `[${ATTRIBUTE_NAME}]`,
    );
    if (mountedRoot instanceof HTMLDivElement && mountedHost.shadowRoot) {
      return {
        root: mountedRoot,
        host: mountedHost as HTMLDivElement,
        dispose: () => {
          if (document.body.contains(mountedHost as Node)) {
            document.body.removeChild(mountedHost as Node);
          }
        }
      };
    }
  }

  const host = document.createElement("div");

  host.setAttribute(ATTRIBUTE_NAME, "true");
  host.style.zIndex = "2147483646";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  const shadowRoot = host.attachShadow({ mode: "open" });

  if (cssText) {
    const styleElement = document.createElement("style");
    styleElement.textContent = cssText;
    shadowRoot.appendChild(styleElement);
  }

  const root = document.createElement("div");

  root.setAttribute(ATTRIBUTE_NAME, "true");

  shadowRoot.appendChild(root);

  const doc = document.body ?? document.documentElement;
  // HACK: wait for hydration (in case something blows away the DOM)
  doc.appendChild(host);

  // HACK:double check after a short delay since
  // something might have blown away the DOM
  setTimeout(() => {
    if (!doc.contains(host)) {
      doc.appendChild(host);
    }
  }, 1_000);

  const dispose = () => {
    if (document.body.contains(host)) {
      document.body.removeChild(host);
    }
  };

  return { root, host, dispose };
};