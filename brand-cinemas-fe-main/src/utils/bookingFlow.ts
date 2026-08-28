/** Pages that hide the main site header on mobile (use page-level header instead). */
export function hidesMobileSiteHeader(pathname: string): boolean {
  return (
    /^\/bookings\/[^/]+\/(summary|success|pay|pending|failed|payment\/finish)$/.test(pathname) ||
    /^\/bookings\/[^/]+\/pay\/instruction$/.test(pathname) ||
    /^\/seat-selection\//.test(pathname)
  );
}

/** Pages that hide the mobile bottom navigation bar. */
export function hidesMobileBottomNav(pathname: string): boolean {
  return (
    /^\/bookings\/[^/]+\/(success|pending|failed|payment\/finish)$/.test(pathname) ||
    /^\/seat-selection\//.test(pathname)
  );
}

/** @deprecated Use hidesMobileSiteHeader or hidesMobileBottomNav */
export function isBookingFlowPath(pathname: string): boolean {
  return hidesMobileSiteHeader(pathname);
}
