# Svelte Grab

Svelte Grab allows you to select an element and copy its context (like HTML, Svelte component, and file source).

It makes tools like Cursor, Claude Code, Copilot run up to [**66% faster**](https://react-grab.com/blog/intro).

## Install

> [**Install using Cursor**](https://cursor.com/link/prompt?text=1.+Run+curl+-s+https%3A%2F%2Freact-grab.com%2Fllms.txt+%0A2.+Understand+the+content+and+follow+the+instructions+to+install+Svelte+Grab.%0A3.+Tell+the+user+to+refresh+their+local+app+and+explain+how+to+use+Svelte+Grab)

Run this command to install Svelte Grab into your project. Ensure you are running at project root (e.g. where the `svelte.config.js` or `vite.config.js` file is located).

```html
npx @svelte-grab/cli@latest
```

## Manual Installation

### SvelteKit

Add this inside of your `src/routes/+layout.svelte`:

```svelte
<script>
  // Initialize Svelte Grab in development
  if (import.meta.env.DEV) {
    import('svelte-grab');
  }
</script>

<slot />
```

### Vite + Svelte

Your `index.html` could look like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <script type="module">
      // first npm i svelte-grab
      // then in head:
      if (import.meta.env.DEV) {
        import("svelte-grab");
      }
    </script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### Other Svelte Projects

First, install Svelte Grab:

```bash
npm install svelte-grab
```

Then add this at the top of your main entry file (e.g., `src/main.js` or `src/app.js`):

```js
if (import.meta.env.DEV) {
  import("svelte-grab");
}
```

## Usage

Once installed, you can activate Svelte Grab by:

1. Pressing `Cmd+G` (on Mac) or `Ctrl+G` (on Windows/Linux)
2. Click and drag to select elements
3. Selected elements will be automatically copied to your clipboard with their context

## Coding Agent Integration (Beta)

Svelte Grab can send selected element context directly to your coding agent. This enables a workflow where you select a UI element and an agent automatically makes changes to your codebase.

This means **no copying and pasting** - just select the element and let the agent do the rest. [Learn more →](https://react-grab.com/blog/agent)

### Claude Code

#### Server Setup

The server runs on port `4567` and interfaces with the Claude Agent SDK. Add to your `package.json`:

```json
{
  "scripts": {
    "dev": "npx @svelte-grab/claude-code@latest && svelte-kit dev"
  }
}
```

#### Client Setup

```html
<script src="//unpkg.com/svelte-grab/dist/index.global.js"></script>
<!-- add this in the <head> -->
<script src="//unpkg.com/@svelte-grab/claude-code/dist/client.global.js"></script>
```

## API

```typescript
import { init } from "svelte-grab/core";

const api = init({
  theme: {
    enabled: true, // disable all UI by setting to false
    hue: 180, // shift colors by 180 degrees (pink → cyan/turquoise)
    crosshair: {
      enabled: false, // disable crosshair
    },
    elementLabel: {
      enabled: false, // disable element label
    },
  },

  onElementSelect: (element) => {
    console.log("Selected:", element);
  },
  onCopySuccess: (elements, content) => {
    console.log("Copied to clipboard:", content);
  },
  onStateChange: (state) => {
    console.log("Active:", state.isActive);
  },
});

api.activate();
api.copyElement(document.querySelector(".my-element"));
console.log(api.getState());
```

## Migration from React Grab

If you're migrating from React Grab to Svelte Grab:

1. Replace `react-grab` with `svelte-grab` in your package.json
2. Update import statements to use `svelte-grab` instead of `react-grab`
3. The API remains largely the same, but now works with Svelte's reactivity system
4. Follow the installation instructions above for Svelte-specific setup

## Resources & Contributing Back

Want to try it out? Check the [our demo](https://react-grab.com).

Looking to contribute back? Check the [Contributing Guide](https://github.com/aidenybai/react-grab/blob/main/CONTRIBUTING.md) out.

Want to talk to the community? Hop in our [Discord](https://discord.com/G7zxfUzkm7) and share your ideas and what you've build with Svelte Grab.

Find a bug? Head over to our [issue tracker](https://github.com/aidenybai/react-grab/issues) and we'll do our best to help. We love pull requests, too!

We expect all contributors to abide by the terms of our [Code of Conduct](https://github.com/aidenybai/react-grab/blob/main/.github/CODE_OF_CONDUCT.md).

[**→ Start contributing on GitHub**](https://github.com/aidenybai/react-grab/blob/main/CONTRIBUTING.md)

### License

Svelte Grab is MIT-licensed open-source software.