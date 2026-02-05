/**
 * 계절·상황(TPO) 코드와 한글 라벨 매핑
 * 서버(추천 API)와 클라이언트(Recommend 페이지)에서 공통 사용
 */
export const SEASON_NAMES: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
};

export const OCCASION_NAMES: Record<string, string> = {
  date_casual: "캐주얼 데이트",
  date_special: "특별한 날 데이트",
  business_work: "출근",
  business_meeting: "프레젠테이션/미팅",
  business_dinner: "회식",
  first_interview: "면접",
  first_blind_date: "소개팅",
  daily_home: "재택근무",
  daily_cafe: "카페",
  daily_travel: "여행",
  event_wedding: "결혼식",
  event_party: "파티",
  event_reunion: "동창회",
};
