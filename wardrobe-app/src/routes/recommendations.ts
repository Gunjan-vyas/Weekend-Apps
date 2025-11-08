import { recommendOutfit, recommendPurchases } from "../services/recommendation";
import { OutfitRecommendationRequest } from "../types";

export async function outfitRecommendationHandler(body: any) {
  try {
    const { occasion, location, weather, season, color_preference } = body;

    if (!occasion || !location) {
      return Response.json(
        { success: false, error: "Occasion and location are required" },
        { status: 400 }
      );
    }

    const request: OutfitRecommendationRequest = {
      occasion,
      location,
      weather,
      season,
      color_preference
    };

    const recommendation = await recommendOutfit(request);
    return Response.json({ success: true, data: recommendation });
  } catch (error) {
    console.error("Error generating outfit recommendation:", error);
    return Response.json(
      { success: false, error: "Failed to generate outfit recommendation" },
      { status: 500 }
    );
  }
}

export async function purchaseRecommendationHandler() {
  try {
    const recommendations = await recommendPurchases();
    return Response.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error generating purchase recommendations:", error);
    return Response.json(
      { success: false, error: "Failed to generate purchase recommendations" },
      { status: 500 }
    );
  }
}

