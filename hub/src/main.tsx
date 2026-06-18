import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppRouter from "./components/AppRouter";
import { TaskProvider } from "./hooks/useTaskStore";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter>
      <TaskProvider>
        <App />
      </TaskProvider>
    </AppRouter>
  </StrictMode>,
);
