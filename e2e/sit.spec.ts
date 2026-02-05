import { test, expect } from "@playwright/test";

/**
 * SIT 테스트 페이지 스모크
 * @see docs/work-ledger/04-Planner-QA.md 테스트 시나리오
 */
test.describe("SIT 테스트 페이지", () => {
  test("접속 시 첫 질문이 표시된다", async ({ page }) => {
    await page.goto("/test");

    // 질문 1 문구 또는 진행률 표시 확인
    await expect(
      page.getByText(/질문\s*1\s*\/\s*12|옷을 선택할 때 가장 중요한 것은/)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("진행률이 표시된다", async ({ page }) => {
    await page.goto("/test");

    await expect(page.getByRole("main", { name: /스타일 정체성 테스트/ })).toBeVisible({
      timeout: 10_000,
    });
  });
});
