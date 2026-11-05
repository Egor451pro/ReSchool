import "server-only";

import type { UserRole } from "@/domain/access/roles";
import { findWalletByUserId, getOrCreateWallet } from "@/server/repositories/wallet-repository";

export type WalletActor = {
  id: string;
  role: UserRole;
};

export async function loadWalletForActor(actor: WalletActor) {
  if (actor.role !== "FREELANCER" && actor.role !== "DONOR_STAFF") {
    return null;
  }
  await getOrCreateWallet(actor.id);
  return findWalletByUserId(actor.id);
}
