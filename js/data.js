import { CONFIG } from './config.loader.js';

/**
 * Robust RFC 4180-compliant CSV Parser (zero external dependencies)
 * Handles quoted fields, escaped quotes (""), newlines inside quotes, trimming, and UTF-8 BOM.
 * 
 * @param {string} text - Raw CSV content
 * @returns {Array<Object>} Array of row objects with lowercase trimmed headers
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  const len = cleanText.length;

  for (let i = 0; i < len; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some(val => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  // Trailing value/row
  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(val => val.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Sanitize headers: remove BOM, lowercase, trim
  const headers = rows[0].map(h =>
    h.replace(/^[\uFEFF]/, '').trim().toLowerCase()
  );

  const data = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      item[header] = (row[c] !== undefined ? row[c] : '').trim();
    }
    data.push(item);
  }

  return data;
}

/**
 * Parses Config tab key/value rows into a clean dictionary
 * 
 * @param {Array<Object>} configRows 
 * @returns {Object}
 */
export function parseConfigMap(configRows) {
  const map = {};
  if (!Array.isArray(configRows)) return map;

  for (const row of configRows) {
    const key = (row.key || row.setting || row.name || '').trim().toLowerCase();
    const val = (row.value || row.val || '').trim();
    if (key) {
      map[key] = val;
    }
  }
  return map;
}

/**
 * Builds a fast-lookup Map of teams indexed by lowercase trimmed name
 * 
 * @param {Array<Object>} teamsList 
 * @returns {Map<string, Object>}
 */
export function buildTeamsMap(teamsList) {
  const map = new Map();
  if (!Array.isArray(teamsList)) return map;

  teamsList.forEach(t => {
    const rawName = t.team_name || t.name || t.team || '';
    if (!rawName) return;

    const normKey = rawName.trim().toLowerCase();
    const teamObj = {
      team_name: rawName.trim(),
      short_code: (t.short_code || rawName.substring(0, 3)).trim().toUpperCase(),
      owner_name: (t.owner_name || t.owner || 'Unassigned').trim(),
      team_color: (t.team_color || t.color || '').trim(),
      logo_url: (t.logo_url || t.logo || '').trim()
    };
    map.set(normKey, teamObj);

    // Support common spelling variant Kathmandu Gorkhas / Gurkhas
    if (normKey === 'kathmandu gurkhas') {
      map.set('kathmandu gorkhas', teamObj);
    } else if (normKey === 'kathmandu gorkhas') {
      map.set('kathmandu gurkhas', teamObj);
    }
  });

  return map;
}

/**
 * Validates references between matches/standings and the teams sheet,
 * issuing helpful console warnings without crashing.
 */
export function validateData(teamsMap, matchesList, standingsList) {
  const checkTeam = (name, context) => {
    if (!name) return;
    const norm = name.trim().toLowerCase();
    if (!teamsMap.has(norm)) {
      console.warn(`[NPL Tracker Warning] Team "${name}" in ${context} was not found in Teams sheet.`);
    }
  };

  if (Array.isArray(matchesList)) {
    matchesList.forEach(m => {
      checkTeam(m.team1, `Matches (match #${m.match_no} team1)`);
      checkTeam(m.team2, `Matches (match #${m.match_no} team2)`);
      if (m.winner) {
        checkTeam(m.winner, `Matches (match #${m.match_no} winner)`);
      }
    });
  }

  if (Array.isArray(standingsList)) {
    standingsList.forEach(s => {
      checkTeam(s.team, 'Standings');
    });
  }
}

/**
 * Appends a cache-busting timestamp to URLs
 */
function addCacheBuster(url) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}

/**
 * Fetch raw CSV text from a given URL with timeout and cache-busting
 */
async function fetchCSV(url) {
  if (!url) return '';
  const targetUrl = addCacheBuster(url);
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/csv, text/plain, */*'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText}) fetching ${url}`);
  }

  return await response.text();
}

/**
 * Retrieves cached application data from localStorage
 */
export function getCachedData() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[NPL Tracker] Failed to read cache:', err);
    return null;
  }
}

/**
 * Saves application data to localStorage
 */
export function saveCachedData(data) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE, JSON.stringify(data));
  } catch (err) {
    console.warn('[NPL Tracker] Failed to save cache:', err);
  }
}

/**
 * Main Data Fetcher
 * Fetches all tabs, parses CSVs, validates, enriches with team metadata, and updates cache.
 * 
 * @returns {Promise<Object>} Processed app data
 */
export async function loadAppData() {
  const isSample = CONFIG.USE_SAMPLE_DATA;
  const urls = isSample ? CONFIG.SAMPLE_URLS : CONFIG.SHEET_URLS;

  if (!isSample && (!urls.TEAMS || !urls.MATCHES || !urls.STANDINGS)) {
    throw new Error('Google Sheet CSV URLs are not configured. Check js/config.js or enable USE_SAMPLE_DATA.');
  }

  // Fetch all CSV files in parallel (Config is optional, so gracefully fall back if missing)
  const [teamsCsv, matchesCsv, standingsCsv, configCsv] = await Promise.all([
    fetchCSV(urls.TEAMS),
    fetchCSV(urls.MATCHES),
    fetchCSV(urls.STANDINGS),
    urls.CONFIG ? fetchCSV(urls.CONFIG).catch(err => {
      console.info('[NPL Tracker] Optional Config tab could not be loaded, using defaults.', err);
      return '';
    }) : Promise.resolve('')
  ]);

  const rawTeams = parseCSV(teamsCsv);
  const rawMatches = parseCSV(matchesCsv);
  const rawStandings = parseCSV(standingsCsv);
  const rawConfig = parseCSV(configCsv);

  const configMap = parseConfigMap(rawConfig);
  const teamsMap = buildTeamsMap(rawTeams);

  // Validate and log warnings
  validateData(teamsMap, rawMatches, rawStandings);

  // Process Matches: join team metadata
  const matches = rawMatches.map((m, idx) => {
    const team1Norm = (m.team1 || '').trim().toLowerCase();
    const team2Norm = (m.team2 || '').trim().toLowerCase();
    const winnerNorm = (m.winner || '').trim().toLowerCase();

    const t1Info = teamsMap.get(team1Norm) || {
      team_name: (m.team1 || 'Team 1').trim(),
      short_code: (m.team1 || 'T1').trim().substring(0, 3).toUpperCase(),
      owner_name: 'Unassigned',
      team_color: '',
      logo_url: ''
    };

    const t2Info = teamsMap.get(team2Norm) || {
      team_name: (m.team2 || 'Team 2').trim(),
      short_code: (m.team2 || 'T2').trim().substring(0, 3).toUpperCase(),
      owner_name: 'Unassigned',
      team_color: '',
      logo_url: ''
    };

    return {
      match_no: m.match_no || String(idx + 1),
      date: (m.date || '').trim(),
      team1: t1Info.team_name,
      team2: t2Info.team_name,
      team1_short: t1Info.short_code,
      team2_short: t2Info.short_code,
      team1_owner: t1Info.owner_name,
      team2_owner: t2Info.owner_name,
      team1_color: t1Info.team_color,
      team2_color: t2Info.team_color,
      team1_logo: t1Info.logo_url,
      team2_logo: t2Info.logo_url,
      team1_score: (m.team1_score || '').trim(),
      team2_score: (m.team2_score || '').trim(),
      winner: (m.winner || '').trim(),
      winner_norm: winnerNorm,
      result_note: (m.result_note || '').trim(),
      status: (m.status || 'Scheduled').trim()
    };
  });

  // Process Standings: strictly preserve sheet values, join owner and team meta
  // Display rows in the order they appear in the Standings tab (or by pos column if provided)
  const standings = rawStandings.map((s, idx) => {
    const teamNorm = (s.team || s.team_name || '').trim().toLowerCase();
    const teamInfo = teamsMap.get(teamNorm) || {
      team_name: (s.team || s.team_name || `Team ${idx + 1}`).trim(),
      short_code: (s.team || 'TM').trim().substring(0, 3).toUpperCase(),
      owner_name: 'Unassigned',
      team_color: '',
      logo_url: ''
    };

    return {
      pos: (s.pos || String(idx + 1)).trim(),
      team: teamInfo.team_name,
      short_code: teamInfo.short_code,
      owner_name: teamInfo.owner_name,
      team_color: teamInfo.team_color,
      logo_url: teamInfo.logo_url,
      played: (s.played || s.p || '0').trim(),
      won: (s.won || s.w || '0').trim(),
      lost: (s.lost || s.l || '0').trim(),
      nr_tie: (s.nr_tie || s['nr/t'] || s.nrt || s.nr || '0').trim(),
      points: (s.points || s.pts || '0').trim(),
      nrr: (s.nrr || '0.000').trim(),
      form: (s.form || '').trim()
    };
  });

  // If pos is provided and can be sorted, check if sorting by pos is cleaner,
  // but specification states: "Display rows in the order they appear in the Standings tab (or by the pos column if provided)."
  // We keep sheet order unless pos is explicitly numerical and unordered
  const hasPos = standings.every(s => s.pos && !isNaN(parseInt(s.pos, 10)));
  if (hasPos) {
    standings.sort((a, b) => parseInt(a.pos, 10) - parseInt(b.pos, 10));
  }

  // Convert teamsMap to array for easy consumption
  const teams = Array.from(teamsMap.values());

  const processedData = {
    seasonName: configMap.season_name || CONFIG.SEASON_NAME,
    lastUpdatedText: configMap.last_updated_text || null,
    playoffSpots: parseInt(configMap.playoff_spots || CONFIG.PLAYOFF_SPOTS, 10) || 4,
    officeGroupName: configMap.office_group_name || '',
    fetchedAt: new Date().toISOString(),
    teams,
    matches,
    standings,
    config: configMap
  };

  // Cache in localStorage
  saveCachedData(processedData);

  return processedData;
}

