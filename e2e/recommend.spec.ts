import { test, expect } from "@playwright/test";

/**
 * 코디 추천 페이지 스모크
 * @see docs/work-ledger/04-Planner-QA.md 알파 검증 체크리스트 #9
 */
test.describe("코디 추천 페이지", () => {
  test("접속 시 계절·상황 선택 UI가 표시된다", async ({ page }) => {
    await page.goto("/recommend");

    await expect(page.getByText("계절 선택").or(page.getByText("상황 선택"))).toBeVisible({
      timeout: 10_000,
    });
  });

  test("추천 받기 버튼 또는 상황 선택 영역이 있다", async ({ page }) => {
    await page.goto("/recommend");

    await expect(
      page.getByRole("button", { name: /추천 받기|추천 생성/ }).or(
        page.getByText(/상황 선택|계절 선택/)
      )
    ).toBeVisible({ timeout: 10_000 });
  });
});
