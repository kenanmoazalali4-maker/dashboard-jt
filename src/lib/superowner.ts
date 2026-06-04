/**
 * Super Owner - This Discord ID always has full permissions
 * and is hidden from the staff/permissions page.
 */
export const SUPER_OWNER_DISCORD_ID = "480506940125085726";

export function isSuperOwner(discordId: string | null | undefined): boolean {
  return discordId === SUPER_OWNER_DISCORD_ID;
}
