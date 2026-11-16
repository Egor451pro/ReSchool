import { connection } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { userChannel } from "@/server/realtime/bus";
import { sseResponse } from "@/server/realtime/sse";

export const instant = false;

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return sseResponse(userChannel(user.id));
}
