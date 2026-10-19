/** Only allow in-app paths as a post-login destination (never an absolute URL). */
export function safeRedirect(from?: string): string {
  return from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') && !from.startsWith('/register') ? from : '/';
}
