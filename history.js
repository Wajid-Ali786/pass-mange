function buildSiteHistoryEntry(site, action, details, at) {
  site.history = Array.isArray(site.history) ? site.history : [];
  site.history.unshift({
    id: PMStorage.uid(),
    action,
    details,
    at: at || PMStorage.nowISO(),
  });
}

async function addPasswordHistoryEntry(site, plainPassword, changedAt) {
  site.passwordHistory = Array.isArray(site.passwordHistory) ? site.passwordHistory : [];
  site.passwordHistory.unshift({
    id: PMStorage.uid(),
    changedAt: changedAt || PMStorage.nowISO(),
    passwordEnc: await PMEncryption.encryptText(plainPassword),
  });
}

window.PMHistory = {
  buildSiteHistoryEntry,
  addPasswordHistoryEntry,
};
