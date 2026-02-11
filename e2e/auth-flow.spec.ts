import { test, expect } from "@playwright/test";

/**
 * 로그인 연동 후 인증 필요 플로우
 * 로컬 개발: GET /api/login 시 mock 유저로 세션 생성·DB upsert 후 리다이렉트.
 * E2E: 로그인 → 프로필 접근 시 사용자 정보 노출 확인.
 * @see docs/work-ledger/04-Planner-QA.md 테스트 시나리오 (인증)
 */
test.describe("인증 필요 플로우 (로그인 + DB)", () => {
  test("로그인 후 프로필 페이지에서 사용자 정보가 표시된다", async ({ page }) => {
    // 로컬 mock: /api/login 방문 시 세션 생성 후 "/" 로 리다이렉트
    await page.goto("/api/login");
    await expect(page).toHaveURL(/\//, { timeout: 15_000 });

    // 프로필 페이지 접근 (인증 필요)
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // mock 유저 정보 노출 (Local Developer, dev@localhost)
    await expect(
      page.getByText(/Local|Developer|dev@localhost/).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("로그인 후 추천 페이지에서 추천 받기 UI가 보인다", async ({ page }) => {
    await page.goto("/api/login");
    await expect(page).toHaveURL(/\//, { timeout: 15_000 });

    await page.goto("/recommend");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("계절 선택").or(page.getByRole("button", { name: /추천 받기/ }))
    ).toBeVisible({ timeout: 10_000 });
  });
});
