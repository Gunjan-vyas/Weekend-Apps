import { healthcheckHandler } from "./routes/healthcheck";
import {
  getAllWardrobeItems,
  getWardrobeItemById,
  createWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem
} from "./routes/wardrobe";
import {
  getAllCollectionsHandler,
  getCollectionByIdHandler,
  createCollectionHandler,
  updateCollectionHandler,
  deleteCollectionHandler
} from "./routes/collections";
import {
  outfitRecommendationHandler,
  purchaseRecommendationHandler
} from "./routes/recommendations";

const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle OPTIONS requests
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/healthcheck" && method === "GET") {
        return healthcheckHandler();
      }

      // Wardrobe items routes
      if (path === "/wardrobe" && method === "GET") {
        return await getAllWardrobeItems();
      }

      if (path === "/wardrobe" && method === "POST") {
        const body = await req.json();
        return await createWardrobeItem(body);
      }

      const wardrobeItemMatch = path.match(/^\/wardrobe\/(\d+)$/);
      if (wardrobeItemMatch) {
        const id = parseInt(wardrobeItemMatch[1], 10);
        if (method === "GET") {
          return await getWardrobeItemById(id);
        }
        if (method === "PUT") {
          const body = await req.json();
          return await updateWardrobeItem(id, body);
        }
        if (method === "DELETE") {
          return await deleteWardrobeItem(id);
        }
      }

      // Collections routes
      if (path === "/collections" && method === "GET") {
        return await getAllCollectionsHandler();
      }

      if (path === "/collections" && method === "POST") {
        const body = await req.json();
        return await createCollectionHandler(body);
      }

      const collectionMatch = path.match(/^\/collections\/(\d+)$/);
      if (collectionMatch) {
        const id = parseInt(collectionMatch[1], 10);
        if (method === "GET") {
          return await getCollectionByIdHandler(id);
        }
        if (method === "PUT") {
          const body = await req.json();
          return await updateCollectionHandler(id, body);
        }
        if (method === "DELETE") {
          return await deleteCollectionHandler(id);
        }
      }

      // Recommendations routes
      if (path === "/recommendations/outfit" && method === "POST") {
        const body = await req.json();
        return await outfitRecommendationHandler(body);
      }

      if (path === "/recommendations/purchase" && method === "GET") {
        return await purchaseRecommendationHandler();
      }

      // 404 for unmatched routes
      return new Response(
        JSON.stringify({ success: false, error: "Route not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Internal server error" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  },
});

console.log(`🚀 Wardrobe API server running on http://localhost:${PORT}`);
console.log(`📋 Available endpoints:`);
console.log(`   GET  /healthcheck`);
console.log(`   GET  /wardrobe`);
console.log(`   POST /wardrobe`);
console.log(`   GET  /wardrobe/:id`);
console.log(`   PUT  /wardrobe/:id`);
console.log(`   DELETE /wardrobe/:id`);
console.log(`   GET  /collections`);
console.log(`   POST /collections`);
console.log(`   GET  /collections/:id`);
console.log(`   PUT  /collections/:id`);
console.log(`   DELETE /collections/:id`);
console.log(`   POST /recommendations/outfit`);
console.log(`   GET  /recommendations/purchase`);

