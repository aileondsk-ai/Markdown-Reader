# 병합 충돌 검토 결과

> 검토일: 2026-02-05 · main vs 4개 워크트리 커밋

---

## 1. main에 각 워크트리 병합 시

| 병합 대상 | 커밋 | 결과 |
|-----------|------|------|
| rzq | 81863bc | **충돌 없음** (자동 병합 가능) |
| mhy | e0a7e30 | **충돌 없음** |
| vbh | d41374f | **충돌 없음** |
| pit | 314b706 | **충돌 없음** |

- 공통 조상: 모두 `0144a34` (main과 동일).
- `git merge-tree` 결과: 모든 파일이 `merged` 또는 `added in remote`로 처리됨.
- "CONFLICT" 문자열이 1건 있으나, **파일 내용(SQL `ON CONFLICT (id) DO UPDATE`)에 포함된 문구**이며 Git 병합 충돌이 아님.

---

## 2. 워크트리 간 서로 병합 시

- **동일 파일을 양쪽에서 수정한 경우**("changed in both")가 많음.
- 공통 수정 파일 예: `.gitignore`, `ShareCard.tsx`, `Evaluate.tsx`, `Recommend.tsx`, `Test.tsx`, `server/routes.ts`, `package.json` 등.
- **실제 Git CONFLICT(충돌 마커)** 는 확인되지 않음. 다만 서로 다른 워크트리 커밋을 그대로 병합하면, 같은 파일의 **서로 다른 변경**이 합쳐지므로 내용 충돌이 날 수 있음.

---

## 3. 권장 사항

- **main에 반영할 때**: 4개 중 **한 커밋만** 선택해 main에 merge (또는 하나를 기준으로 정리 후 merge). 여러 개를 동시에 merge하면 같은 파일의 서로 다른 수정이 겹칠 수 있음.
- **기준 추천**: **rzq (81863bc)** — E2E·추천 프롬프트 분리·에러 로깅 등이 포함된 버전.
- main 작업 디렉터리가 비어 있어야 merge 가능. (`git status` clean 후 진행)
