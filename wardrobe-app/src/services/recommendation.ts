import { getAllItems, WardrobeItem } from "../db";
import { OutfitRecommendation, OutfitRecommendationRequest, PurchaseRecommendation } from "../types";

export async function recommendOutfit(request: OutfitRecommendationRequest): Promise<OutfitRecommendation> {
  const allItems = await getAllItems();
  
  // Filter items based on occasion and location
  const suitableItems = allItems.filter(item => {
    const matchesOccasion = !item.occasion || 
      item.occasion.toLowerCase().includes(request.occasion.toLowerCase()) ||
      request.occasion.toLowerCase().includes(item.occasion.toLowerCase());
    
    const matchesLocation = !item.location ||
      item.location.toLowerCase().includes(request.location.toLowerCase()) ||
      request.location.toLowerCase().includes(item.location.toLowerCase());
    
    const matchesSeason = !request.season || !item.season ||
      item.season.toLowerCase() === request.season.toLowerCase();
    
    return matchesOccasion && matchesLocation && matchesSeason;
  });

  // Categorize items
  const tops = suitableItems.filter(item => 
    ["shirt", "t-shirt", "blouse", "sweater", "hoodie", "top"].some(
      type => item.clothType.toLowerCase().includes(type)
    )
  );
  
  const bottoms = suitableItems.filter(item =>
    ["pants", "jeans", "trousers", "shorts", "skirt", "bottom"].some(
      type => item.clothType.toLowerCase().includes(type)
    )
  );
  
  const outerwear = suitableItems.filter(item =>
    ["jacket", "coat", "blazer", "cardigan", "outerwear"].some(
      type => item.clothType.toLowerCase().includes(type)
    )
  );
  
  const shoes = suitableItems.filter(item =>
    ["shoes", "sneakers", "boots", "sandals", "heels", "footwear"].some(
      type => item.clothType.toLowerCase().includes(type)
    )
  );
  
  const accessories = suitableItems.filter(item =>
    ["accessory", "hat", "scarf", "belt", "bag", "watch", "jewelry"].some(
      type => item.clothType.toLowerCase().includes(type)
    )
  );

  // Select best items (prioritize by condition and recency)
  const selectBest = (items: WardrobeItem[]) => {
    if (items.length === 0) return undefined;
    return items
      .sort((a, b) => {
        // Prioritize good condition
        const conditionOrder = { "excellent": 3, "good": 2, "fair": 1, "poor": 0 };
        const aCond = conditionOrder[a.condition?.toLowerCase() as keyof typeof conditionOrder] || 1;
        const bCond = conditionOrder[b.condition?.toLowerCase() as keyof typeof conditionOrder] || 1;
        if (aCond !== bCond) return bCond - aCond;
        
        // Then by recency (newer items first)
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      })[0];
  };

  const selectedTop = selectBest(tops);
  const selectedBottom = selectBest(bottoms);
  const selectedOuterwear = selectBest(outerwear);
  const selectedShoes = selectBest(shoes);
  const selectedAccessories = accessories.slice(0, 3).map(a => a.id!).filter(Boolean);

  let reasoning = `Recommended outfit for ${request.occasion} at ${request.location}.`;
  if (selectedTop) reasoning += ` Top: ${selectedTop.name}.`;
  if (selectedBottom) reasoning += ` Bottom: ${selectedBottom.name}.`;
  if (selectedOuterwear) reasoning += ` Outerwear: ${selectedOuterwear.name}.`;
  if (selectedShoes) reasoning += ` Shoes: ${selectedShoes.name}.`;
  if (selectedAccessories.length > 0) reasoning += ` Accessories included.`;

  return {
    top: selectedTop?.id,
    bottom: selectedBottom?.id,
    outerwear: selectedOuterwear?.id,
    shoes: selectedShoes?.id,
    accessories: selectedAccessories,
    reasoning
  };
}

export async function recommendPurchases(): Promise<PurchaseRecommendation[]> {
  const allItems = await getAllItems();
  
  const recommendations: PurchaseRecommendation[] = [];
  
  // Analyze wardrobe composition
  const itemTypes = new Map<string, number>();
  allItems.forEach(item => {
    const type = item.clothType.toLowerCase();
    itemTypes.set(type, (itemTypes.get(type) || 0) + 1);
  });

  // Check for missing essentials
  const essentials = [
    { type: "t-shirt", category: "tops", priority: "high" as const },
    { type: "shirt", category: "tops", priority: "high" as const },
    { type: "pants", category: "bottoms", priority: "high" as const },
    { type: "jeans", category: "bottoms", priority: "high" as const },
    { type: "jacket", category: "outerwear", priority: "medium" as const },
    { type: "shoes", category: "footwear", priority: "high" as const },
  ];

  essentials.forEach(essential => {
    const count = Array.from(itemTypes.entries())
      .filter(([type]) => type.includes(essential.type))
      .reduce((sum, [, count]) => sum + count, 0);

    if (count < 2) {
      recommendations.push({
        category: essential.category,
        item_type: essential.type,
        reason: `You have ${count} ${essential.type}(s). Consider adding more for variety.`,
        priority: essential.priority,
        suggested_details: {
          color: "neutral colors (black, white, navy, beige)",
          fabric: "cotton or cotton blend",
          season: "all-season"
        }
      });
    }
  });

  // Check for seasonal gaps
  const seasons = ["spring", "summer", "fall", "winter"];
  seasons.forEach(season => {
    const seasonalItems = allItems.filter(item => 
      item.season?.toLowerCase() === season
    );
    
    if (seasonalItems.length < 3) {
      recommendations.push({
        category: "seasonal",
        item_type: `${season} clothing`,
        reason: `Limited ${season} wardrobe. Consider adding ${season}-appropriate items.`,
        priority: "medium" as const,
        suggested_details: {
          season: season
        }
      });
    }
  });

  // Check for condition issues
  const poorConditionItems = allItems.filter(item => 
    item.condition?.toLowerCase() === "poor"
  );
  
  if (poorConditionItems.length > 0) {
    const typesNeedingReplacement = new Set(
      poorConditionItems.map(item => item.clothType)
    );
    
    typesNeedingReplacement.forEach(type => {
      recommendations.push({
        category: "replacement",
        item_type: type,
        reason: `Some ${type} items are in poor condition and may need replacement.`,
        priority: "low" as const
      });
    });
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  return recommendations.slice(0, 10); // Return top 10 recommendations
}

