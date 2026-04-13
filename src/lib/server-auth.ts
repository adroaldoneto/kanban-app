import { NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { ApiError } from "@/lib/http";

export type AuthenticatedUser = {
  uid: string;
  email?: string;
};

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "Token de autenticação não informado.");
  }

  const idToken = authorization.replace("Bearer ", "").trim();
  if (!idToken) {
    throw new ApiError(401, "Token de autenticação inválido.");
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch {
    throw new ApiError(401, "Sessão expirada ou token inválido.");
  }
}
