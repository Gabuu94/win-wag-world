// Centralised currency display helpers.
// Per business rule: Kenyan users see KES, everyone else sees USD.
// All wallet balances and bets are denominated in the user's profile currency.

export type ProfileLike = { country?: string | null; currency?: string | null } | null | undefined;

export const isKenyan = (profile: ProfileLike): boolean => {
  if (!profile) return false;
  return (profile.country || "").toUpperCase() === "KE" || (profile.currency || "").toUpperCase() === "KES";
};

export const getCurrencyCode = (profile: ProfileLike): string => {
  return isKenyan(profile) ? "KES" : "USD";
};

// Format an amount with the correct currency symbol/code.
// KES -> "KES 1,234.00", USD -> "$1,234.00"
export const formatMoney = (amount: number, profile: ProfileLike): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (isKenyan(profile)) {
    return `KES ${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const currencySymbol = (profile: ProfileLike): string => (isKenyan(profile) ? "KES" : "$");
