# GitHub 업로드 방법

> 작업 브랜치 `share-sit-recs`가 로컬에 준비되어 있습니다.

---

## 1. GitHub 원격 추가 (최초 1회)

GitHub에서 저장소를 만든 뒤, 아래에서 **본인 계정/저장소 이름**으로 바꿉니다.

```bash
cd /Users/lifegoeson/Downloads/Markdown-Reader

# HTTPS (추천)
git remote add origin https://github.com/본인계정/저장소이름.git

# 또는 SSH
git remote add origin git@github.com:본인계정/저장소이름.git
```

---

## 2. 브랜치 푸시

```bash
# 작업 반영 브랜치 푸시 (rzq 워크트리 커밋 81863bc)
git push -u origin share-sit-recs

# main도 올릴 경우
git push -u origin main
```

---

## 3. 현재 로컬 상태

| 브랜치 | 커밋 | 설명 |
|--------|------|------|
| main | 0144a34 | 기존 최신 |
| share-sit-recs | 81863bc | 업무노트·로컬인증·추천·E2E·프롬프트 분리 (푸시 대상) |

---

## 4. 참고

- 원격 `gitsafe-backup`(git://gitsafe:5418/...)는 현재 호스트를 찾을 수 없어 푸시 불가.
- GitHub 저장소가 이미 있다면 `git remote add origin <URL>` 후 `git push -u origin share-sit-recs`만 실행하면 됩니다.
