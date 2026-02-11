import { test, expect } from "@playwright/test";

/**
 * 패션 평가 페이지 스모크
 * @see docs/work-ledger/04-Planner-QA.md 알파 검증 체크리스트 #6
 */
test.describe("패션 평가 페이지", () => {
  test("접속 시 AI 패션 평가 제목과 업로드 영역이 표시된다", async ({ page }) => {
    await page.goto("/evaluate");

    await expect(
      page.getByRole("heading", { name: /AI 패션 평가/ }).or(page.getByText(/착장 사진을 업로드/))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("페르소나 탭 또는 업로드 영역이 있다", async ({ page }) => {
    await page.goto("/evaluate");

    await expect(
      page.getByText(/드래그 앤 드롭|업로드|수진|민수|지현/).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
