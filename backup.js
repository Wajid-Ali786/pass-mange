function createBackupPayload() {
  return {
    sites: window.pmSites || [],
    settings: PMStorage.loadSettings(),
    meta: {
      exportedAt: PMStorage.nowISO(),
      version: 3
    }
  };
}

function exportBackup() {
  const payload = createBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `password-manager-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Backup exported', 'success');
}

function importBackupFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.sites)) throw new Error('Invalid backup format');
      PMStorage.saveSites(data.sites);
      if (data.settings && typeof data.settings === 'object') {
        PMStorage.saveSettings({ ...PMStorage.loadSettings(), ...data.settings });
      }
      PMStorage.saveAutoBackupSnapshot(data);
      showToast('Backup imported', 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (_) {
      showToast('Import failed. Invalid JSON backup.', 'error');
    }
  };
  reader.readAsText(file);
}

function runAutoBackup() {
  const settings = PMStorage.loadSettings();
  if (!settings.autoBackup) return;
  PMStorage.saveAutoBackupSnapshot(createBackupPayload());
}

const importFileInput = document.getElementById('importFile');
if (importFileInput) {
  importFileInput.addEventListener('change', (e) => importBackupFromFile(e.target.files[0]));
}
