import { CONFIG } from './config.loader.js';
import { loadAppData, getCachedData } from './data.js';
import {
  renderHeader,
  renderMatchesSection,
  renderStandingsTable,
  renderOwnerLeaderboard,
  showSkeletons,
  renderError,
  setRefreshLoading
} from './ui.js';

// Application State
const state = {
  data: null,
  activeDate: null,
  isRefreshing: false
};

/**
 * Initializes Theme (Dark mode default, honors localStorage and prefers-color-scheme)
 */
function initTheme() {
  const storedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
  let effectiveTheme = 'dark';

  if (storedTheme) {
    effectiveTheme = storedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    // If user's OS explicitly prefers light, honor it; otherwise default is dark
    effectiveTheme = 'light';
  }

  applyTheme(effectiveTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);

  const themeIcon = document.getElementById('theme-icon');
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  if (themeBtn) {
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    themeBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const target = current === 'dark' ? 'light' : 'dark';
  applyTheme(target);
}

/**
 * Callback when user selects another date in the match day selector
 */
function handleDateChange(newDate) {
  state.activeDate = newDate;
  if (state.data && state.data.matches) {
    renderMatchesSection(state.data.matches, state.activeDate, handleDateChange);
  }
}

/**
 * Renders all views with currently loaded data
 */
function renderAll() {
  if (!state.data) return;

  renderHeader(state.data);
  renderMatchesSection(state.data.matches, state.activeDate, handleDateChange);
  renderStandingsTable(state.data.standings, state.data.playoffSpots);
  renderOwnerLeaderboard(state.data.standings);
}

/**
 * Fetches fresh data and updates UI
 */
async function refreshData(isManual = false) {
  if (state.isRefreshing) return;
  state.isRefreshing = true;
  setRefreshLoading(true);

  try {
    const freshData = await loadAppData();
    state.data = freshData;
    renderAll();
  } catch (err) {
    console.error('[NPL Tracker] Data load error:', err);

    // If we have zero data loaded, show friendly full error state
    if (!state.data) {
      renderError(err.message, () => refreshData(true));
    } else {
      // Soft notice if cached data was already showing
      console.warn('[NPL Tracker] Could not fetch fresh data; continuing with cached data.');
    }
  } finally {
    state.isRefreshing = false;
    setRefreshLoading(false);
  }
}

/**
 * Bootstrap the Application
 */
async function init() {
  initTheme();

  // 1. Stale-While-Revalidate: check for cached data to display instantly
  const cached = getCachedData();
  if (cached && cached.matches && cached.standings) {
    state.data = cached;
    renderAll();
  } else {
    // Cold load without cache: display skeleton loaders
    showSkeletons();
  }

  // 2. Fetch fresh live data
  await refreshData();

  // 3. Set up manual refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => refreshData(true));
  }

  // 4. Auto-refresh timer (every 5 minutes)
  setInterval(() => {
    if (!document.hidden) {
      refreshData(false);
    }
  }, CONFIG.REFRESH_INTERVAL_MS);

  // 5. Re-fetch when user switches back to tab after being away
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.data) {
      const lastFetched = new Date(state.data.fetchedAt || 0).getTime();
      const elapsed = Date.now() - lastFetched;
      if (elapsed > CONFIG.REFRESH_INTERVAL_MS) {
        refreshData(false);
      }
    }
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

