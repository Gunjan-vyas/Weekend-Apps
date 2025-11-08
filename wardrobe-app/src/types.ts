export interface OutfitRecommendationRequest {
  occasion: string;
  location: string;
  weather?: string;
  season?: string;
  color_preference?: string;
}

export interface OutfitRecommendation {
  top?: number;
  bottom?: number;
  outerwear?: number;
  shoes?: number;
  accessories?: number[];
  reasoning: string;
}

export interface PurchaseRecommendation {
  category: string;
  item_type: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggested_details?: {
    color?: string;
    fabric?: string;
    season?: string;
  };
}

