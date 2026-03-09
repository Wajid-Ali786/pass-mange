function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
}

function loadTheme() {
  const settings = PMStorage.loadSettings();
  applyTheme(settings.theme || 'light');
}

function toggleTheme() {
  const settings = PMStorage.loadSettings();
  const next = settings.theme === 'dark' ? 'light' : 'dark';
  PMStorage.saveSettings({ ...settings, theme: next });
  applyTheme(next);
  showToast(`Theme changed to ${next}`, 'success');
}

loadTheme();
window.toggleTheme = toggleTheme;
