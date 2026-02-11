/**
 * 제품 추천 목업 데이터 (Phase 1)
 * 더미 이미지: placeholder 서비스 사용 (차후 DB/API 연동 시 imageUrl 교체)
 */
import type { Product, ProductsByCategory } from "@shared/types/products";

/** 제품 id별 고정 더미 이미지 URL (200x200) */
function dummyImage(id: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;
}

const MOCK_TOP: Product[] = [
  { id: "top-1", name: "베이직 오버핏 니트", brand: "무드코드", price: 49000, category: "top", imageUrl: dummyImage("top-1") },
  { id: "top-2", name: "린넨 블렌드 셔츠", brand: "데일리룩", price: 35000, category: "top", imageUrl: dummyImage("top-2") },
  { id: "top-3", name: "라운드넥 긴팔 티", brand: "유니폼플레이스", price: 19900, category: "top", imageUrl: dummyImage("top-3") },
];

const MOCK_BOTTOM: Product[] = [
  { id: "bottom-1", name: "슬림 와이드 팬츠", brand: "무드코드", price: 59000, category: "bottom", imageUrl: dummyImage("bottom-1") },
  { id: "bottom-2", name: "코튼 치노 팬츠", brand: "데일리룩", price: 42000, category: "bottom", imageUrl: dummyImage("bottom-2") },
  { id: "bottom-3", name: "밴딩 슬랙스", brand: "오피스룩", price: 55000, category: "bottom", imageUrl: dummyImage("bottom-3") },
];

const MOCK_SHOES: Product[] = [
  { id: "shoes-1", name: "캔버스 스니커즈", brand: "컨버스스타일", price: 69000, category: "shoes", imageUrl: dummyImage("shoes-1") },
  { id: "shoes-2", name: "로우컷 레더 스니커즈", brand: "데일리룩", price: 89000, category: "shoes", imageUrl: dummyImage("shoes-2") },
  { id: "shoes-3", name: "클래식 옥스포드", brand: "오피스룩", price: 120000, category: "shoes", imageUrl: dummyImage("shoes-3") },
];

const MOCK_ACCESSORY: Product[] = [
  { id: "acc-1", name: "미니 크로스백", brand: "엑세서리룩", price: 35000, category: "accessory", imageUrl: dummyImage("acc-1") },
  { id: "acc-2", name: "실버 팔찌 세트", brand: "데일리룩", price: 19000, category: "accessory", imageUrl: dummyImage("acc-2") },
  { id: "acc-3", name: "클래식 벨트", brand: "무드코드", price: 29000, category: "accessory", imageUrl: dummyImage("acc-3") },
];

/**
 * 카테고리별 목업 제품 반환 (스타일 추천 응답에 부착용)
 */
export function getMockProductsByCategory(): ProductsByCategory {
  return {
    top: [...MOCK_TOP],
    bottom: [...MOCK_BOTTOM],
    shoes: [...MOCK_SHOES],
    accessory: [...MOCK_ACCESSORY],
  };
}
