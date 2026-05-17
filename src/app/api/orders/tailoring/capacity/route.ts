import { NextRequest, NextResponse } from "next/server";
import { getCapacityInfo } from "@/services/tailoringCapacityService";
import { verifyUserToken } from "@/utils/server/authUtils";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tailorId = searchParams.get("tailorId");

    if (!tailorId) {
      return NextResponse.json(
        { error: "tailorId parameter required" },
        { status: 400 },
      );
    }

    const capacityInfo = await getCapacityInfo(tailorId);

    return NextResponse.json(
      {
        success: true,
        ...capacityInfo,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching capacity info:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Tailor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch capacity info" },
      { status: 500 },
    );
  }
}
