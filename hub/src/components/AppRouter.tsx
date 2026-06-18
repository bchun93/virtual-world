import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

interface AppRouterProps {
  children: ReactNode;
}

export default function AppRouter({ children }: AppRouterProps) {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <BrowserRouter basename={basename || undefined}>{children}</BrowserRouter>
  );
}
