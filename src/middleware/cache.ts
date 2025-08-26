import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  vary?: string[]; // Headers to vary cache on
  private?: boolean; // Private cache (user-specific)
  staleWhileRevalidate?: number; // Seconds to serve stale content while revalidating
  etag?: boolean; // Generate ETag
  lastModified?: boolean; // Set Last-Modified header
}

/**
 * Enhanced caching middleware for mobile optimization
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    vary = ['Authorization'],
    private: isPrivate = false,
    staleWhileRevalidate = 0,
    etag = true,
    lastModified = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = generateCacheKey(req, vary);
    
    // Set cache headers
    const cacheControl = buildCacheControl(ttl, isPrivate, staleWhileRevalidate);
    res.set('Cache-Control', cacheControl);

    // Set Vary headers
    if (vary.length > 0) {
      res.set('Vary', vary.join(', '));
    }

    // Generate ETag if enabled
    if (etag) {
      res.set('ETag', `"${cacheKey}"`);
      
      // Check if client has matching ETag
      const clientETag = req.headers['if-none-match'];
      if (clientETag === `"${cacheKey}"`) {
        return res.status(304).end();
      }
    }

    // Set Last-Modified if enabled
    if (lastModified) {
      const lastMod = new Date().toUTCString();
      res.set('Last-Modified', lastMod);
      
      // Check if client has newer version
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastMod)) {
        return res.status(304).end();
      }
    }

    // Add mobile-optimized headers
    res.set({
      'X-Cache-Key': cacheKey,
      'X-Cache-TTL': ttl.toString(),
    });

    next();
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, vary: string[]): string {
  const keyParts = [
    req.method,
    req.originalUrl,
    req.query ? JSON.stringify(req.query) : '',
  ];

  // Add varying headers to cache key
  for (const header of vary) {
    const value = req.headers[header.toLowerCase()];
    keyParts.push(value ? value.toString() : '');
  }

  const keyString = keyParts.join('|');
  return createHash('md5').update(keyString).digest('hex');
}

/**
 * Build Cache-Control header value
 */
function buildCacheControl(
  ttl: number,
  isPrivate: boolean,
  staleWhileRevalidate: number
): string {
  const parts: string[] = [];

  // Public or private
  parts.push(isPrivate ? 'private' : 'public');

  // Max age
  parts.push(`max-age=${ttl}`);

  // Stale while revalidate
  if (staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  return parts.join(', ');
}

/**
 * No-cache middleware for sensitive endpoints
 */
export function noCache(req: Request, res: Response, next: NextFunction) {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
}

/**
 * Short cache for frequently changing data
 */
export function shortCache(req: Request, res: Response, next: NextFunction) {
  return cache({ ttl: 60, etag: true })(req, res, next); // 1 minute
}

/**
 * Medium cache for semi-static data
 */
export function mediumCache(req: Request, res: Response, next: NextFunction) {
  return cache({ ttl: 900, etag: true })(req, res, next); // 15 minutes
}

/**
 * Long cache for static data
 */
export function longCache(req: Request, res: Response, next: NextFunction) {
  return cache({ ttl: 3600, etag: true })(req, res, next); // 1 hour
}

/**
 * User-specific cache for private data
 */
export function userCache(ttl: number = 300) {
  return cache({
    ttl,
    private: true,
    vary: ['Authorization'],
    etag: true,
  });
}
