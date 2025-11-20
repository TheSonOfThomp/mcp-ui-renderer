# Micro-UI Renderer Demo

A scalable architecture for building and serving React Micro-UIs using Vite. Each component is automatically built into its own standalone HTML file.

## 🚀 Quickstart

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open `http://localhost:5173` to see the index of available micro-UIs.

## 📝 How to Add a Micro-UI

1.  **Create a file** in `src/micro-uis/` (e.g., `MyFeature.tsx`).
2.  **Export your component** (named or default).
3.  **Done!** Access it at `/MyFeature.html`.

## 🛠 How It Works

This project uses a custom Vite plugin to automate the boilerplate usually required for multi-page apps:

*   **Auto-Discovery**: The plugin scans `src/micro-uis/` for `.tsx` files.
*   **Virtual Entries**: It automatically generates an HTML file and a React entry point for each component using `micro-ui-template.html` and `micro-ui-entry-template.tsx`.
*   **Production Build**: Running `pnpm build` outputs separate HTML files for each component in `dist/`, perfect for embedding in IFrames or independent distribution.

## 📂 Project Structure

*   `src/micro-uis/`: Directory for your standalone components.
*   `src/main.tsx`: The index page listing all components in development.
*   `vite.config.ts`: Contains the custom plugin logic.
*   `micro-ui-template.html`: The HTML shell template.
*   `micro-ui-entry-template.tsx`: The React mounting boilerplate.
