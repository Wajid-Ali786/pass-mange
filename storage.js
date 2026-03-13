const PM_STORAGE_KEY = 'pm_sites_v2';
const PM_HISTORY_KEY = 'pm_global_history_v2';
const PM_SETTINGS_KEY = 'pm_settings_v2';
const PM_BACKUP_KEY = 'pm_auto_backup_v2';

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

async function normalizeLoadedSites(sites) {
  const normalized = [];
  for (const site of sites || []) {
    const next = { ...site };

    if (!next.passwordEnc && typeof next.password === 'string') {
      next.passwordEnc = await PMEncryption.encryptText(next.password);
      delete next.password;
    }

    const history = Array.isArray(next.passwordHistory) ? next.passwordHistory : [];
    next.passwordHistory = [];

    for (const entry of history) {
      if (entry.passwordEnc) {
        next.passwordHistory.push(entry);
      } else if (entry.password) {
        next.passwordHistory.push({
          id: entry.id || uid(),
          changedAt: entry.changedAt || entry.at || nowISO(),
          passwordEnc: await PMEncryption.encryptText(entry.password),
        });
      }
    }

    if (!next.passwordHistory.length && next.passwordEnc) {
      next.passwordHistory.push({ id: uid(), changedAt: next.passwordUpdatedAt || nowISO(), passwordEnc: next.passwordEnc });
    }

    next.favorite = !!next.favorite;
    next.pinned = !!next.pinned;
    next.collapsed = !!next.collapsed;
    next.category = next.category || 'General';
    next.categoryColor = next.categoryColor || '#3964ff';
    next.manualOrder = typeof next.manualOrder === 'number' ? next.manualOrder : Date.now();
    normalized.push(next);
  }
  return normalized;
}

async function loadSites() {
  const raw = safeParse(PM_STORAGE_KEY, []);
  return normalizeLoadedSites(raw);
}

function saveSites(sites) {
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(sites));
}

function loadGlobalHistory() {
  return safeParse(PM_HISTORY_KEY, []);
}

function saveGlobalHistory(history) {
  localStorage.setItem(PM_HISTORY_KEY, JSON.stringify(history));
}

function loadSettings() {
  return {
    theme: 'light',
    autoBackup: true,
    pageSize: 10,
    sortBy: 'manual',
    favoritesOnly: false,
    categoryFilter: 'all',
    ...safeParse(PM_SETTINGS_KEY, {}),
  };
}

function saveSettings(settings) {
  localStorage.setItem(PM_SETTINGS_KEY, JSON.stringify(settings));
}

function saveAutoBackupSnapshot(payload) {
  localStorage.setItem(PM_BACKUP_KEY, JSON.stringify({ backupAt: nowISO(), ...payload }));
}

function loadAutoBackupSnapshot() {
  return safeParse(PM_BACKUP_KEY, null);
}

async function createSite(data) {
  const updatedAt = data.customPassDate || nowISO();
  const passwordEnc = await PMEncryption.encryptText(data.password || '');
  return {
    id: uid(),
    name: (data.name || '').trim(),
    url: (data.url || '').trim(),
    username: (data.username || '').trim(),
    passwordEnc,
    favorite: !!data.favorite,
    pinned: !!data.pinned,
    collapsed: false,
    category: data.category || 'General',
    categoryColor: data.categoryColor || '#3964ff',
    lastUsedAt: updatedAt,
    manualOrder: Date.now(),
    createdAt: nowISO(),
    updatedAt,
    passwordUpdatedAt: updatedAt,
    history: [{ id: uid(), action: 'created', at: nowISO(), details: 'Entry created' }],
    passwordHistory: [{ id: uid(), changedAt: updatedAt, passwordEnc }],
  };
}

function addGlobalHistory(history, site, action, details) {
  history.unshift({
    id: uid(),
    siteId: site.id,
    siteName: site.name,
    action,
    details,
    at: nowISO(),
  });
}

window.PMStorage = {
  uid,
  nowISO,
  loadSites,
  saveSites,
  loadGlobalHistory,
  saveGlobalHistory,
  loadSettings,
  saveSettings,
  saveAutoBackupSnapshot,
  loadAutoBackupSnapshot,
  createSite,
  addGlobalHistory,
};
