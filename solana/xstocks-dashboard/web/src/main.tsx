import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./ui.tsx";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter-tight/400.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/600.css";
import "./app.css";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
