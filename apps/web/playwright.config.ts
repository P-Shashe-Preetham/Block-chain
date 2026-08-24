import { defineConfig } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (process.env.CI ? undefined : "/usr/bin/chromium");

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4301",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 4301",
    url: "http://127.0.0.1:4301",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [{
    name: "chromium-system",
    use: {
      browserName: "chromium",
      launchOptions: {
        ...(executablePath ? { executablePath } : {}),
        args: ["--no-sandbox"],
      },
    },
  }],
});
