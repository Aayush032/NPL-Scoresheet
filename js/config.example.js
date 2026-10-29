/**
 * NPL Season 3 Office Tracker - Example Configuration Template
 * 
 * To connect your live Google Sheet:
 * 1. Publish each sheet tab as CSV:
 *    File > Share > Publish to web > Choose Tab > Comma-separated values (.csv)
 * 2. Copy this file to `js/config.js`
 * 3. Paste the published CSV URLs into SHEET_URLS and set USE_SAMPLE_DATA to false.
 */

export const CONFIG = {
  // Toggle between local sample CSV files and live Google Sheets CSV URLs
  USE_SAMPLE_DATA: true,

  // Default season title (can be overridden by Config tab)
  SEASON_NAME: 'NPL Season 3 - Office Edition',

  // Number of top playoff qualification spots to highlight
  PLAYOFF_SPOTS: 4,

  // Auto-refresh interval while page stays open (5 minutes)
  REFRESH_INTERVAL_MS: 5 * 60 * 1000,

  // Live Google Sheet CSV URLs
  SHEET_URLS: {
    TEAMS: '',
    MATCHES: '',
    STANDINGS: '',
    CONFIG: ''
  },

  // Local sample CSV paths (relative paths ensuring GitHub Pages works seamlessly)
  SAMPLE_URLS: {
    TEAMS: './sample-data/teams.csv',
    MATCHES: './sample-data/matches.csv',
    STANDINGS: './sample-data/standings.csv',
    CONFIG: './sample-data/config.csv'
  },

  // LocalStorage keys
  STORAGE_KEYS: {
    CACHE: 'npl_office_tracker_cache_v1',
    THEME: 'npl_office_tracker_theme',
    CUSTOM_URLS: 'npl_office_tracker_custom_urls'
  }
};

