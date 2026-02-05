import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 설정. 실행 전 `npm run dev`로 서버를 띄우거나,
 * webServer로 자동 기동 후 테스트합니다.
 * @see docs/qa/e2e-adoption.md
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  // 포트 5000이 이미 사용 중이면 다른 터미널에서 `npm run dev` 실행 후 `npm run test:e2e`만 실행하면 됨 (reuseExistingServer가 기동 중인 서버 사용)
});
