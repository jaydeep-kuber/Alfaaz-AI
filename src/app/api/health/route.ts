import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker Compose and container readiness.
 * Returns HTTP 200 with service status.
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "alfaaz-app",
    timestamp: new Date().toISOString(),
  });
}
