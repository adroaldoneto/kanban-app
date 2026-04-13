import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/http";
import { ensureDefaultBoard, listBoards } from "@/lib/kanban-store";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    await ensureDefaultBoard(user.uid);
    const boards = await listBoards(user.uid);
    return NextResponse.json({ boards });
  } catch (error) {
    return handleApiError(error);
  }
}
