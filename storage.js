const PM_STORAGE_KEY = 'pm_sites_v2';
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

function loadSites() {
  const sites = safeParse(PM_STORAGE_KEY, []);
  return sites.map((site) => ({
    ...site,
    passwordHistory: Array.isArray(site.passwordHistory)
      ? site.passwordHistory
      : site.password
        ? [{ id: uid(), password: site.password, setAt: site.passwordUpdatedAt || site.updatedAt || nowISO(), note: 'Migrated current password' }]
        : []
  }));
}

function saveSites(sites) {
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(sites));
}

function loadSettings() {
  return {
    theme: 'light',
    autoBackup: true,
    ...safeParse(PM_SETTINGS_KEY, {})
  };
}

function saveSettings(settings) {
  localStorage.setItem(PM_SETTINGS_KEY, JSON.stringify(settings));
}

function saveAutoBackupSnapshot(payload) {
  localStorage.setItem(PM_BACKUP_KEY, JSON.stringify({
    backupAt: nowISO(),
    ...payload
  }));
}

function createSite(data) {
  const updatedAt = data.customPassDate || nowISO();
  return {
    id: uid(),
    name: (data.name || '').trim(),
    url: (data.url || '').trim(),
    username: (data.username || '').trim(),
    password: data.password || '',
    favorite: !!data.favorite,
    createdAt: nowISO(),
    updatedAt,
    passwordUpdatedAt: updatedAt,
    passwordHistory: []
  };
}

window.PMStorage = {
  uid,
  nowISO,
  loadSites,
  saveSites,
  loadSettings,
  saveSettings,
  saveAutoBackupSnapshot,
  createSite
};
