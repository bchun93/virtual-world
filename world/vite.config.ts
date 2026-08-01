import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoName = "virtual-world";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGitHubPages ? `/${repoName}/` : "/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
