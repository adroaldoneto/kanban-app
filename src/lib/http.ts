import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(statusCode: number, message: string) {
  return NextResponse.json({ error: message }, { status: statusCode });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.message);
  }

  console.error("[API_ERROR]", error);
  return errorResponse(500, "Erro interno ao processar a solicitação.");
}
