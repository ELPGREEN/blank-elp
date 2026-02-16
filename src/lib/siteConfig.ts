/**
 * Site Configuration
 * 
 * Centralized configuration for production URLs and site settings.
 * Always use these values for external links, emails, and PDFs.
 */

// Production domain - always use this for external links
export const SITE_DOMAIN = 'https://www.elpgreen.com';

// Helper to generate full URLs
export const getSiteUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_DOMAIN}${normalizedPath}`;
};

// Common URLs
export const SITE_URLS = {
  home: SITE_DOMAIN,
  contact: getSiteUrl('/contact'),
  marketplace: getSiteUrl('/marketplace'),
  otrSources: getSiteUrl('/otr-sources'),
  requestQuote: getSiteUrl('/request-quote'),
  sign: getSiteUrl('/sign'),
  
  // Document templates - use function for dynamic IDs
  documentTemplate: (templateId: string) => getSiteUrl(`/documents/template/${templateId}`),
  document: (documentId: string) => getSiteUrl(`/documents/${documentId}`),
  signDocument: (documentId: string) => getSiteUrl(`/sign?doc=${documentId}`),
};

// Email configuration
export const EMAIL_CONFIG = {
  logoUrl: `${SITE_DOMAIN}/logo-elp-email.png`,
  supportEmail: 'info@elpgreen.com',
  website: 'www.elpgreen.com',
};
