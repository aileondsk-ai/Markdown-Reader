/**
 * 제품 추천 공통 타입
 * Phase 1: 목업 · Phase 2: DB 또는 외부 API 연동 시 동일 스키마 사용
 */
export type ProductCategory = "top" | "bottom" | "shoes" | "accessory";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  link?: string;
  category: ProductCategory;
}

export interface ProductsByCategory {
  top: Product[];
  bottom: Product[];
  shoes: Product[];
  accessory: Product[];
}
