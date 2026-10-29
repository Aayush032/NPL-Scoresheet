import { CONFIG } from './config.loader.js';

/**
 * Safe DOM Element Creator (Zero raw innerHTML with external/sheet data)
 */
export function el(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, val] of Object.entries(attributes)) {
    if (key === 'className' || key === 'class') {
      element.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(element.style, val);
    } else if (key === 'dataset' && typeof val === 'object') {
      for (const [dKey, dVal] of Object.entries(val)) {
        element.dataset[dKey] = dVal;
      }
    } else if (key.startsWith('on') && typeof val === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), val);
    } else if (val !== null && val !== undefined) {
      element.setAttribute(key, String(val));
    }
  }

  for (const child of children) {
    if (child === null || child === undefined) continue;
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c instanceof Node) element.appendChild(c);
        else if (c !== null && c !== undefined) element.appendChild(document.createTextNode(String(c)));
      }
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else {
      element.appendChild(document.createTextNode(String(child)));
    }
  }

  return element;
}

/**
 * Returns a valid hex/hsl color for a team, falling back to a deterministic HSL color
 */
export function getTeamColor(color, name) {
  if (color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) {
    return color.trim();
  }
  let hash = 0;
  const str = name || 'Team';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 68%, 46%)`;
}

/**
 * Extracts initials from an owner name (e.g., "Aayush Shrestha" -> "AS")
 */
export function getInitials(name) {
  if (!name || name === 'Unassigned') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formats a YYYY-MM-DD date string into a friendly readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Builds a team badge with logo or colored circle fallback
 */
export function createTeamBadge(teamName, shortCode, color, logoUrl) {
  const effectiveColor = getTeamColor(color, teamName);

  if (logoUrl) {
    const img = el('img', {
      src: logoUrl,
      alt: `${teamName} Logo`,
      class: 'team-logo',
      loading: 'lazy'
    });
    // Fallback if image fails to load
    img.onerror = () => {
      const parent = img.parentElement;
      if (parent) {
        const fallback = createInitialsBadge(shortCode, effectiveColor);
        parent.replaceChild(fallback, img);
      }
    };
    return img;
  }

  return createInitialsBadge(shortCode, effectiveColor);
}

function createInitialsBadge(shortCode, color) {
  return el('div', {
    class: 'team-badge-circle',
    style: {
      backgroundColor: color,
      borderColor: color
    },
    'aria-hidden': 'true'
  }, shortCode || 'TM');
}

/**
 * Builds an owner avatar element
 */
export function createOwnerAvatar(name) {
  const initials = getInitials(name);
  return el('div', {
    class: 'owner-avatar',
    title: `Owner: ${name}`,
    'aria-hidden': 'true'
  }, initials);
}

/**
 * Builds Form dots (W, L, T, NR)
 */
export function createFormPills(formStr) {
  if (!formStr) return el('span', { class: 'text-muted' }, '-');

  const container = el('div', { class: 'form-pills', 'aria-label': `Recent form: ${formStr}` });
  const chars = formStr.trim().toUpperCase().split('');

  for (const ch of chars) {
    let pillClass = 'form-dot-nr';
    let pillText = ch;
    let label = 'No Result';

    if (ch === 'W') {
      pillClass = 'form-dot-w';
      label = 'Win';
    } else if (ch === 'L') {
      pillClass = 'form-dot-l';
      label = 'Loss';
    } else if (ch === 'T') {
      pillClass = 'form-dot-t';
      label = 'Tie';
    } else if (ch === 'N') {
      pillClass = 'form-dot-nr';
      pillText = 'NR';
      label = 'No Result';
    }

    const dot = el('span', {
      class: `form-dot ${pillClass}`,
      title: label
    }, pillText);
    container.appendChild(dot);
  }

  return container;
}

/**
 * Updates Header text & badges
 */
export function renderHeader(data) {
  const titleEl = document.getElementById('season-title');
  if (titleEl) {
    titleEl.textContent = data.seasonName || CONFIG.SEASON_NAME;
  }

  const officeTagEl = document.getElementById('office-tag');
  if (officeTagEl) {
    if (data.officeGroupName) {
      officeTagEl.textContent = data.officeGroupName;
      officeTagEl.style.display = 'inline-flex';
    } else {
      officeTagEl.style.display = 'none';
    }
  }

  const updatedEl = document.getElementById('last-updated-text');
  if (updatedEl) {
    if (data.lastUpdatedText) {
      updatedEl.textContent = data.lastUpdatedText;
    } else if (data.fetchedAt) {
      const d = new Date(data.fetchedAt);
      updatedEl.textContent = `Updated ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  const sampleBanner = document.getElementById('sample-mode-banner');
  if (sampleBanner) {
    sampleBanner.style.display = CONFIG.USE_SAMPLE_DATA ? 'flex' : 'none';
  }
}

/**
 * Renders the Latest Match Day Section
 */
export function renderMatchesSection(matches, activeDate, onDateChange) {
  const container = document.getElementById('matches-container');
  const selector = document.getElementById('date-selector');
  const prevBtn = document.getElementById('prev-date-btn');
  const nextBtn = document.getElementById('next-date-btn');

  if (!container) return;
  container.innerHTML = '';

  if (!matches || matches.length === 0) {
    container.appendChild(
      el('div', { class: 'empty-state' },
        el('div', { class: 'empty-icon' }, '🏏'),
        el('p', {}, 'No matches recorded yet. Matches will appear once published in the sheet.')
      )
    );
    if (selector) selector.innerHTML = '<option value="">No match dates</option>';
    return;
  }

  // Extract unique sorted dates
  const dates = Array.from(new Set(matches.map(m => m.date).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));

  if (dates.length === 0) {
    container.appendChild(
      el('div', { class: 'empty-state' },
        el('p', {}, 'No match schedule dates found.')
      )
    );
    return;
  }

  // Determine current active date
  let selectedDate = activeDate;
  if (!selectedDate || !dates.includes(selectedDate)) {
    // Default to the most recent date with Completed or Tie/No Result matches
    const activeDates = matches
      .filter(m => m.status && m.status.toLowerCase() !== 'scheduled')
      .map(m => m.date)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    selectedDate = activeDates.length > 0 ? activeDates[activeDates.length - 1] : dates[dates.length - 1];
  }

  // Populate Date Selector Dropdown
  if (selector) {
    selector.innerHTML = '';
    dates.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      const formatted = formatDate(d);
      const isLatestCompleted = d === selectedDate;
      opt.textContent = `${formatted}${isLatestCompleted ? ' (Current View)' : ''}`;
      if (d === selectedDate) opt.selected = true;
      selector.appendChild(opt);
    });

    selector.onchange = (e) => {
      if (typeof onDateChange === 'function') {
        onDateChange(e.target.value);
      }
    };
  }

  // Prev / Next button state
  const currentIndex = dates.indexOf(selectedDate);
  if (prevBtn) {
    prevBtn.disabled = currentIndex <= 0;
    prevBtn.onclick = () => {
      if (currentIndex > 0 && typeof onDateChange === 'function') {
        onDateChange(dates[currentIndex - 1]);
      }
    };
  }
  if (nextBtn) {
    nextBtn.disabled = currentIndex >= dates.length - 1;
    nextBtn.onclick = () => {
      if (currentIndex < dates.length - 1 && typeof onDateChange === 'function') {
        onDateChange(dates[currentIndex + 1]);
      }
    };
  }

  // Filter matches for selected date
  const dayMatches = matches.filter(m => m.date === selectedDate);

  if (dayMatches.length === 0) {
    container.appendChild(
      el('div', { class: 'empty-state' },
        el('p', {}, `No matches scheduled on ${formatDate(selectedDate)}.`)
      )
    );
    return;
  }

  // Render cards grid
  const grid = el('div', { class: 'matches-grid' });

  dayMatches.forEach(m => {
    const isCompleted = m.status.toLowerCase() === 'completed';
    const isScheduled = m.status.toLowerCase() === 'scheduled';
    const isTie = m.status.toLowerCase() === 'tie';
    const isNoResult = m.status.toLowerCase() === 'no result';

    let statusClass = 'status-upcoming';
    let statusLabel = 'Upcoming';

    if (isCompleted) {
      statusClass = 'status-completed';
      statusLabel = 'Completed';
    } else if (isTie) {
      statusClass = 'status-tie';
      statusLabel = 'Tie';
    } else if (isNoResult) {
      statusClass = 'status-no-result';
      statusLabel = 'No Result';
    }

    const t1IsWinner = isCompleted && m.winner_norm && m.winner_norm === m.team1.trim().toLowerCase();
    const t2IsWinner = isCompleted && m.winner_norm && m.winner_norm === m.team2.trim().toLowerCase();

    // Team 1 Row
    const t1Row = el('div', {
      class: `match-team-row ${t1IsWinner ? 'winner-row' : ''} ${t2IsWinner ? 'loser-row' : ''}`
    },
      el('div', { class: 'team-info-group' },
        el('div', {
          class: 'team-color-indicator',
          style: { backgroundColor: getTeamColor(m.team1_color, m.team1) }
        }),
        createTeamBadge(m.team1, m.team1_short, m.team1_color, m.team1_logo),
        el('div', { class: 'team-names' },
          el('div', { class: 'team-title-row' },
            el('span', { class: 'team-name-text' }, m.team1),
            t1IsWinner ? el('span', { class: 'winner-crown', title: 'Winner' }, '🏆') : null
          ),
          el('div', { class: 'owner-pill' },
            createOwnerAvatar(m.team1_owner),
            el('span', { class: 'owner-name-label' }, m.team1_owner)
          )
        )
      ),
      el('div', { class: 'team-score-display' },
        m.team1_score ? el('span', { class: `score-text ${t1IsWinner ? 'score-winner' : ''}` }, m.team1_score) : el('span', { class: 'score-pending' }, isScheduled ? '—' : '-')
      )
    );

    // Team 2 Row
    const t2Row = el('div', {
      class: `match-team-row ${t2IsWinner ? 'winner-row' : ''} ${t1IsWinner ? 'loser-row' : ''}`
    },
      el('div', { class: 'team-info-group' },
        el('div', {
          class: 'team-color-indicator',
          style: { backgroundColor: getTeamColor(m.team2_color, m.team2) }
        }),
        createTeamBadge(m.team2, m.team2_short, m.team2_color, m.team2_logo),
        el('div', { class: 'team-names' },
          el('div', { class: 'team-title-row' },
            el('span', { class: 'team-name-text' }, m.team2),
            t2IsWinner ? el('span', { class: 'winner-crown', title: 'Winner' }, '🏆') : null
          ),
          el('div', { class: 'owner-pill' },
            createOwnerAvatar(m.team2_owner),
            el('span', { class: 'owner-name-label' }, m.team2_owner)
          )
        )
      ),
      el('div', { class: 'team-score-display' },
        m.team2_score ? el('span', { class: `score-text ${t2IsWinner ? 'score-winner' : ''}` }, m.team2_score) : el('span', { class: 'score-pending' }, isScheduled ? '—' : '-')
      )
    );

    // Card element
    const card = el('article', {
      class: `match-card ${isScheduled ? 'match-card-upcoming' : ''}`,
      'aria-label': `Match ${m.match_no}: ${m.team1} vs ${m.team2}`
    },
      el('div', { class: 'match-card-header' },
        el('span', { class: 'match-number-tag' }, `Match #${m.match_no}`),
        el('span', { class: `match-status-badge ${statusClass}` }, statusLabel)
      ),
      el('div', { class: 'match-card-teams' },
        t1Row,
        el('div', { class: 'match-teams-divider' }),
        t2Row
      ),
      m.result_note ? el('div', { class: 'match-result-footer' },
        el('span', { class: 'result-note-icon' }, '📌'),
        el('span', { class: 'result-note-text' }, m.result_note)
      ) : null
    );

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Renders the Points Table Section (strictly displays sheet values, no recomputation)
 */
export function renderStandingsTable(standings, playoffSpots = 4) {
  const container = document.getElementById('standings-table-container');
  if (!container) return;
  container.innerHTML = '';

  if (!standings || standings.length === 0) {
    container.appendChild(
      el('div', { class: 'empty-state' },
        el('p', {}, 'No standings data available. Update the Standings sheet to see positions.')
      )
    );
    return;
  }

  const hasForm = standings.some(s => Boolean(s.form));

  const table = el('table', { class: 'standings-table', 'aria-label': 'NPL Season 3 Points Table' },
    el('thead', {},
      el('tr', {},
        el('th', { scope: 'col', class: 'col-pos' }, 'Pos'),
        el('th', { scope: 'col', class: 'col-team' }, 'Team & Member'),
        el('th', { scope: 'col', class: 'col-stat' }, 'P'),
        el('th', { scope: 'col', class: 'col-stat' }, 'W'),
        el('th', { scope: 'col', class: 'col-stat' }, 'L'),
        el('th', { scope: 'col', class: 'col-stat' }, 'NR/T'),
        el('th', { scope: 'col', class: 'col-pts' }, 'Pts'),
        el('th', { scope: 'col', class: 'col-nrr' }, 'NRR'),
        hasForm ? el('th', { scope: 'col', class: 'col-form' }, 'Form') : null
      )
    ),
    el('tbody', {})
  );

  const tbody = table.querySelector('tbody');

  standings.forEach((row, idx) => {
    const isPlayoffZone = idx < playoffSpots;
    const teamColor = getTeamColor(row.team_color, row.team);

    const tr = el('tr', {
      class: `standings-row ${isPlayoffZone ? 'playoff-spot' : ''}`
    },
      // Pos
      el('td', { class: 'cell-pos' },
        el('div', { class: 'pos-wrapper' },
          el('span', { class: `pos-number ${isPlayoffZone ? 'playoff-pos' : ''}` }, row.pos),
          isPlayoffZone ? el('span', { class: 'playoff-dot', title: 'Playoff Qualification Zone' }) : null
        )
      ),
      // Team & Owner
      el('td', { class: 'cell-team' },
        el('div', { class: 'team-owner-combo' },
          createTeamBadge(row.team, row.short_code, row.team_color, row.logo_url),
          el('div', { class: 'team-and-owner-texts' },
            el('div', { class: 'table-team-name' },
              el('span', { class: 'color-pip', style: { backgroundColor: teamColor } }),
              el('span', { class: 'name-str' }, row.team)
            ),
            el('div', { class: 'table-owner-name' },
              createOwnerAvatar(row.owner_name),
              el('span', { class: 'owner-str' }, row.owner_name)
            )
          )
        )
      ),
      // Stats: strictly as sheet provides
      el('td', { class: 'cell-stat' }, row.played),
      el('td', { class: 'cell-stat' }, row.won),
      el('td', { class: 'cell-stat' }, row.lost),
      el('td', { class: 'cell-stat' }, row.nr_tie),
      el('td', { class: 'cell-pts' },
        el('strong', { class: 'pts-value' }, row.points)
      ),
      el('td', { class: 'cell-nrr' }, row.nrr),
      hasForm ? el('td', { class: 'cell-form' }, createFormPills(row.form)) : null
    );

    tbody.appendChild(tr);
  });

  const wrapper = el('div', { class: 'table-responsive' }, table);
  container.appendChild(wrapper);

  // Playoff Legend
  const legend = el('div', { class: 'standings-legend' },
    el('span', { class: 'legend-color-box' }),
    el('span', { class: 'legend-text' }, `Top ${playoffSpots} qualify for Playoffs / Finals`)
  );
  container.appendChild(legend);
}

/**
 * Renders the Owner Leaderboard Section
 * Reuses sheet values strictly, grouped/focused on members
 */
export function renderOwnerLeaderboard(standings) {
  const container = document.getElementById('owner-leaderboard-container');
  if (!container) return;
  container.innerHTML = '';

  if (!standings || standings.length === 0) {
    container.appendChild(
      el('div', { class: 'empty-state' },
        el('p', {}, 'No owner rankings available.')
      )
    );
    return;
  }

  const grid = el('div', { class: 'owner-grid' });

  standings.forEach((row, idx) => {
    const isTop3 = idx < 3;
    const rankBadges = ['🥇', '🥈', '🥉'];
    const rankBadge = isTop3 ? rankBadges[idx] : `#${row.pos}`;
    const teamColor = getTeamColor(row.team_color, row.team);

    const card = el('div', {
      class: `owner-card ${isTop3 ? `owner-top-${idx + 1}` : ''}`,
      'aria-label': `${row.owner_name} - ${row.team}`
    },
      el('div', { class: 'owner-card-top' },
        el('div', { class: 'owner-card-profile' },
          createOwnerAvatar(row.owner_name),
          el('div', { class: 'owner-profile-details' },
            el('h4', { class: 'owner-profile-name' }, row.owner_name),
            el('div', { class: 'owner-team-tag' },
              el('span', { class: 'team-dot', style: { backgroundColor: teamColor } }),
              el('span', { class: 'team-tag-name' }, row.team)
            )
          )
        ),
        el('div', { class: 'owner-rank-badge' }, rankBadge)
      ),
      el('div', { class: 'owner-card-stats' },
        el('div', { class: 'stat-pill' },
          el('span', { class: 'stat-label' }, 'Points'),
          el('span', { class: 'stat-val stat-pts' }, row.points)
        ),
        el('div', { class: 'stat-pill' },
          el('span', { class: 'stat-label' }, 'Record'),
          el('span', { class: 'stat-val' }, `${row.won}W - ${row.lost}L`)
        ),
        el('div', { class: 'stat-pill' },
          el('span', { class: 'stat-label' }, 'NRR'),
          el('span', { class: 'stat-val' }, row.nrr)
        )
      )
    );

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Shows skeleton loaders across all sections while fetching fresh data
 */
export function showSkeletons() {
  const matchesContainer = document.getElementById('matches-container');
  if (matchesContainer) {
    matchesContainer.innerHTML = '';
    const grid = el('div', { class: 'matches-grid' });
    for (let i = 0; i < 2; i++) {
      grid.appendChild(
        el('div', { class: 'skeleton-card match-skeleton' },
          el('div', { class: 'skeleton-line skeleton-header' }),
          el('div', { class: 'skeleton-line skeleton-row' }),
          el('div', { class: 'skeleton-line skeleton-row' }),
          el('div', { class: 'skeleton-line skeleton-footer' })
        )
      );
    }
    matchesContainer.appendChild(grid);
  }

  const tableContainer = document.getElementById('standings-table-container');
  if (tableContainer) {
    tableContainer.innerHTML = '';
    const wrapper = el('div', { class: 'skeleton-table-wrapper' });
    for (let i = 0; i < 6; i++) {
      wrapper.appendChild(el('div', { class: 'skeleton-line skeleton-table-row' }));
    }
    tableContainer.appendChild(wrapper);
  }

  const leaderboardContainer = document.getElementById('owner-leaderboard-container');
  if (leaderboardContainer) {
    leaderboardContainer.innerHTML = '';
    const grid = el('div', { class: 'owner-grid' });
    for (let i = 0; i < 4; i++) {
      grid.appendChild(el('div', { class: 'skeleton-card owner-skeleton' }));
    }
    leaderboardContainer.appendChild(grid);
  }
}

/**
 * Renders an accessible error state with Retry button
 */
export function renderError(message, onRetry) {
  const main = document.getElementById('main-content');
  if (!main) return;

  const existingError = document.getElementById('global-error-banner');
  if (existingError) existingError.remove();

  const errorBanner = el('div', {
    id: 'global-error-banner',
    class: 'error-banner',
    role: 'alert'
  },
    el('div', { class: 'error-content' },
      el('span', { class: 'error-icon' }, '⚠️'),
      el('div', { class: 'error-texts' },
        el('strong', {}, 'Failed to load live data'),
        el('p', {}, message || 'Could not fetch Google Sheets CSV data. Please check your network or CSV URLs.')
      )
    ),
    el('button', {
      class: 'btn btn-primary retry-btn',
      onClick: () => {
        errorBanner.remove();
        if (typeof onRetry === 'function') onRetry();
      }
    }, '🔄 Retry')
  );

  main.prepend(errorBanner);
}

/**
 * Sets spinning state on the refresh button
 */
export function setRefreshLoading(isLoading) {
  const btn = document.getElementById('refresh-btn');
  if (btn) {
    if (isLoading) {
      btn.classList.add('loading');
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('disabled', 'true');
    } else {
      btn.classList.remove('loading');
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('disabled');
    }
  }
}

