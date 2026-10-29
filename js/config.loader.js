/**
 * NPL Season 3 Office Tracker - Configuration Loader
 * 
 * Securely loads configuration with graceful fallbacks:
 * 1. Attempts to load `js/config.js` (which is kept in .gitignore to protect live URLs).
 * 2. If `config.js` is hidden or missing (e.g. public GitHub Pages), falls back to `config.example.js`.
 * 3. Supports live overrides stored in browser localStorage.
 */

import { CONFIG as config } from './config.js';

let activeConfig = { ...config };

try {
  // Attempt to load private config.js
  const userModule = await import('./config.js');
  if (userModule && userModule.CONFIG) {
    activeConfig = {
      ...activeConfig,
      ...userModule.CONFIG,
      SHEET_URLS: {
        ...activeConfig.SHEET_URLS,
        ...(userModule.CONFIG.SHEET_URLS || {})
      },
      SAMPLE_URLS: {
        ...activeConfig.SAMPLE_URLS,
        ...(userModule.CONFIG.SAMPLE_URLS || {})
      }
    };
  }
} catch {
  // js/config.js is gitignored / not present on remote
  console.info('[NPL Tracker] js/config.js is not present in repo; using default configuration.');
}

// Allow browser localStorage overrides
try {
  const custom = localStorage.getItem('npl_office_tracker_custom_urls');
  if (custom) {
    const parsed = JSON.parse(custom);
    if (parsed && typeof parsed === 'object') {
      activeConfig.SHEET_URLS = { ...activeConfig.SHEET_URLS, ...parsed };
      activeConfig.USE_SAMPLE_DATA = false;
    }
  }
} catch {
  // Ignore localStorage parse errors
}

export const CONFIG = activeConfig;

