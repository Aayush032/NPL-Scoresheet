/**
 * NPL Season 3 Office Tracker - Configuration
 * 
 * To connect your live Google Sheet:
 * 1. Publish each sheet tab as CSV:
 *    File > Share > Publish to web > Choose Tab > Comma-separated values (.csv)
 * 2. Paste the published CSV URLs into the SHEET_URLS object below.
 * 3. Set USE_SAMPLE_DATA to false.
 */

export const CONFIG = {
  // Toggle between local sample CSV files and live Google Sheets CSV URLs
  USE_SAMPLE_DATA: false,

  // Default season title (can be overridden by Config tab)
  SEASON_NAME: 'NPL Season 3 - Office Edition',

  // Number of top playoff qualification spots to highlight
  PLAYOFF_SPOTS: 4,

  // Auto-refresh interval while page stays open (5 minutes)
  REFRESH_INTERVAL_MS: 5 * 60 * 1000,

  // Live Google Sheet CSV URLs (leave empty or fill in your published links)
  SHEET_URLS: {
    TEAMS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjnCxrBrnE0iLn0dh_svDP-gk2P_1Gb7LYn3G2NvlCx41ajDv_qJsxPk6gwtbMFW83uBC4hPXne1GU/pub?gid=505805869&single=true&output=csv',
    MATCHES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjnCxrBrnE0iLn0dh_svDP-gk2P_1Gb7LYn3G2NvlCx41ajDv_qJsxPk6gwtbMFW83uBC4hPXne1GU/pub?gid=614448147&single=true&output=csv',
    STANDINGS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjnCxrBrnE0iLn0dh_svDP-gk2P_1Gb7LYn3G2NvlCx41ajDv_qJsxPk6gwtbMFW83uBC4hPXne1GU/pub?gid=1059343783&single=true&output=csv',
    CONFIG: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjnCxrBrnE0iLn0dh_svDP-gk2P_1Gb7LYn3G2NvlCx41ajDv_qJsxPk6gwtbMFW83uBC4hPXne1GU/pub?gid=262541324&single=true&output=csv'
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
    THEME: 'npl_office_tracker_theme'
  }
};

