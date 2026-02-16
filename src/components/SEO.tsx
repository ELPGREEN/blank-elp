import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_DOMAIN } from '@/lib/siteConfig';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  locale?: string;
  alternateLocales?: string[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

export function SEO({ 
  title, 
  description, 
  image = `${SITE_DOMAIN}/og-image.jpg`,
  url,
  type = 'website',
  keywords,
  author = 'ELP Green Technology',
  publishedAt,
  modifiedAt,
  locale = 'pt_BR',
  alternateLocales = ['en_US', 'es_ES', 'it_IT', 'zh_CN'],
  jsonLd,
  noindex = false,
}: SEOProps) {
  const location = useLocation();
  const canonicalUrl = url || `${SITE_DOMAIN}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string, attrs?: Record<string, string>) => {
      const selector = attrs 
        ? `link[rel="${rel}"]${Object.entries(attrs).map(([k, v]) => `[${k}="${v}"]`).join('')}` 
        : `link[rel="${rel}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        if (attrs) Object.entries(attrs).forEach(([k, v]) => element!.setAttribute(k, v));
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // ===== BASIC META TAGS =====
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }
    updateMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1');
    updateMetaTag('bingbot', 'index, follow');

    // ===== OPEN GRAPH (Facebook, LinkedIn, WhatsApp) =====
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:secure_url', image, true);
    updateMetaTag('og:image:type', 'image/jpeg', true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', title, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:site_name', 'ELP Green Technology', true);
    updateMetaTag('og:locale', locale, true);
    alternateLocales.forEach(loc => {
      updateMetaTag(`og:locale:alternate`, loc, true);
    });

    // ===== TWITTER CARD =====
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@elpgreen');
    updateMetaTag('twitter:creator', '@elpgreen');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', title);

    // ===== ARTICLE META (for blog/press pages) =====
    if (type === 'article') {
      if (publishedAt) updateMetaTag('article:published_time', publishedAt, true);
      if (modifiedAt) updateMetaTag('article:modified_time', modifiedAt, true);
      updateMetaTag('article:author', author, true);
    }

    // ===== CANONICAL URL =====
    updateLinkTag('canonical', canonicalUrl);

    // ===== HREFLANG TAGS (multilingual SEO) =====
    const langMap: Record<string, string> = {
      pt: 'pt-BR',
      en: 'en',
      es: 'es',
      it: 'it',
      zh: 'zh-Hans',
    };
    Object.entries(langMap).forEach(([lang, hreflang]) => {
      const langUrl = `${SITE_DOMAIN}${location.pathname}?lang=${lang}`;
      updateLinkTag('alternate', langUrl, { hreflang });
    });
    updateLinkTag('alternate', canonicalUrl, { hreflang: 'x-default' });

    // ===== JSON-LD STRUCTURED DATA =====
    // Remove old JSON-LD
    document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());

    const schemas: Record<string, unknown>[] = [];

    // Default Organization schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ELP Green Technology',
      alternateName: ['ELP Green', 'ELP Green Tech'],
      url: SITE_DOMAIN,
      logo: `${SITE_DOMAIN}/logo-elp-new.png`,
      image: `${SITE_DOMAIN}/og-image.jpg`,
      description: 'Global leader in circular economy, tire recycling, pyrolysis technology and sustainable industrial solutions.',
      foundingDate: '2020',
      sameAs: [
        'https://www.linkedin.com/company/elpgreen/',
        'https://www.youtube.com/@elpgreen/videos',
        'https://x.com/elpgreen_',
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          email: 'info@elpgreen.com',
          contactType: 'customer service',
          availableLanguage: ['Portuguese', 'English', 'Spanish', 'Italian', 'Chinese'],
        },
      ],
      address: [
        {
          '@type': 'PostalAddress',
          addressCountry: 'IT',
        },
        {
          '@type': 'PostalAddress',
          addressCountry: 'BR',
        },
        {
          '@type': 'PostalAddress',
          addressCountry: 'DE',
        },
        {
          '@type': 'PostalAddress',
          addressCountry: 'CN',
        },
      ],
      knowsAbout: [
        'Tire Recycling',
        'Pyrolysis Technology',
        'Circular Economy',
        'OTR Tire Processing',
        'Rubber Powder Production',
        'Carbon Black Recovery',
        'Industrial Sustainability',
        'ESG',
      ],
    });

    // WebSite schema with SearchAction
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ELP Green Technology',
      url: SITE_DOMAIN,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_DOMAIN}/solutions?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: ['pt-BR', 'en', 'es', 'it', 'zh-Hans'],
    });

    // WebPage schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: description,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'ELP Green Technology',
        url: SITE_DOMAIN,
      },
      inLanguage: locale.replace('_', '-'),
      ...(publishedAt && { datePublished: publishedAt }),
      ...(modifiedAt && { dateModified: modifiedAt }),
    });

    // BreadcrumbList
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_DOMAIN },
          ...pathSegments.map((segment, i) => ({
            '@type': 'ListItem',
            position: i + 2,
            name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
            item: `${SITE_DOMAIN}/${pathSegments.slice(0, i + 1).join('/')}`,
          })),
        ],
      });
    }

    // Custom JSON-LD from props
    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        schemas.push(...jsonLd);
      } else {
        schemas.push(jsonLd);
      }
    }

    // Inject all schemas
    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.title = 'ELP Green Technology';
      document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    };
  }, [title, description, image, url, type, keywords, author, publishedAt, modifiedAt, locale, alternateLocales, jsonLd, noindex, canonicalUrl, location.pathname]);

  return null;
}
