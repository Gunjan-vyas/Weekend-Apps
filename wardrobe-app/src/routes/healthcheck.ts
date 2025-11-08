export function healthcheckHandler() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "wardrobe-api"
  });
}

