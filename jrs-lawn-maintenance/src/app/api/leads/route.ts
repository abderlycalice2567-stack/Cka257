import { after } from "next/server";
import { handleLeadPost } from "@/lib/leads/handler";
import { leadInfrastructure } from "@/lib/leads/deps";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { env, store, mailer } = leadInfrastructure();
  return handleLeadPost(req, { store, mailer, notifyTo: env.notifyTo, defer: (task) => after(task) });
}
