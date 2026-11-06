let signedInUserId: string | null = null;

/** Remembers who is signed in for this app process. Financial queries use this id. */
export function setActiveUserId(userId: string | null): void {
  signedInUserId = userId;
}

/** The signed-in user, or null on the login screen. */
export function activeUserId(): string | null {
  return signedInUserId;
}

/** User id for a write. Throws when nobody is signed in so a row is never saved without an owner. */
export function requireUserId(): string {
  if (!signedInUserId) throw new Error('sign-in-required');
  return signedInUserId;
}
