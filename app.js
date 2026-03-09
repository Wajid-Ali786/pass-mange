let pmSites = PMStorage.loadSites();
window.pmSites = pmSites;

const modal = document.getElementById('siteModal');
const modalTitle = document.getElementById('modalTitle');
const siteNameInput = document.getElementById('siteName');
const siteURLInput = document.getElementById('siteURL');
const siteUserInput = document.getElementById('siteUser');
const sitePassInput = document.getElementById('sitePass');
const passDateInput = document.getElementById('passDate');
const favoriteInput = document.getElementById('favoriteCheck');
const searchInput = document.getElementById('searchInput');
const siteContainer = document.getElementById('sitesContainer');
const historyContainer = document.getElementById('history');
const loader = document.getElementById('pageLoader');

let editingSiteId = null;

function showLoader() {
  loader.classList.remove('hidden');
}

function hideLoader() {
  setTimeout(() => loader.classList.add('hidden'), 250);
}

function persistData() {
  PMStorage.saveSites(pmSites);
  runAutoBackup();
}

function openAddForm() {
  editingSiteId = null;
  modalTitle.textContent = 'Add Password';
  siteNameInput.value = '';
  siteURLInput.value = '';
  siteUserInput.value = '';
  sitePassInput.value = '';
  passDateInput.value = new Date().toISOString().slice(0, 16);
  favoriteInput.checked = false;
  modal.style.display = 'flex';
}

function openEditForm(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  editingSiteId = id;
  modalTitle.textContent = 'Edit Password';
  siteNameInput.value = site.name;
  siteURLInput.value = site.url;
  siteUserInput.value = site.username;
  sitePassInput.value = site.password;
  passDateInput.value = (site.passwordUpdatedAt || '').slice(0, 16);
  favoriteInput.checked = site.favorite;
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
}

function buildPasswordHistoryEntry(site, password, setAt, note) {
  if (!site.passwordHistory) site.passwordHistory = [];
  site.passwordHistory.unshift({
    id: PMStorage.uid(),
    password,
    setAt: setAt || PMStorage.nowISO(),
    note: note || 'Password set'
  });
}

function saveSite() {
  const data = {
    name: siteNameInput.value,
    url: siteURLInput.value,
    username: siteUserInput.value,
    password: sitePassInput.value,
    customPassDate: passDateInput.value ? new Date(passDateInput.value).toISOString() : PMStorage.nowISO(),
    favorite: favoriteInput.checked
  };

  if (!data.name || !data.url || !data.username || !data.password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  if (!editingSiteId) {
    const site = PMStorage.createSite(data);
    buildPasswordHistoryEntry(site, data.password, data.customPassDate, 'Initial password');
    pmSites.unshift(site);
    showToast('Entry added', 'success');
  } else {
    const site = pmSites.find((s) => s.id === editingSiteId);
    if (!site) return;

    const oldPassword = site.password;
    site.name = data.name.trim();
    site.url = data.url.trim();
    site.username = data.username.trim();
    site.password = data.password;
    site.favorite = data.favorite;
    site.passwordUpdatedAt = data.customPassDate;
    site.updatedAt = PMStorage.nowISO();

    if (oldPassword !== data.password) {
      buildPasswordHistoryEntry(site, data.password, data.customPassDate, 'Password updated');
    }

    showToast('Entry updated', 'success');
  }

  persistData();
  renderSites();
  renderPasswordHistoryView();
  closeModal();
}

function deleteSiteById(id) {
  pmSites = pmSites.filter((s) => s.id !== id);
  window.pmSites = pmSites;
  persistData();
  renderSites();
  renderPasswordHistoryView();
  showToast('Entry deleted', 'error');
}

function toggleFavoriteSite(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  site.favorite = !site.favorite;
  site.updatedAt = PMStorage.nowISO();
  persistData();
  renderSites();
  showToast(site.favorite ? 'Added to favorites' : 'Removed from favorites');
}

function togglePassword(btn, id) {
  const text = document.getElementById(`pass_${id}`);
  const masked = text.dataset.masked === 'true';
  text.dataset.masked = masked ? 'false' : 'true';
  text.textContent = masked ? text.dataset.password : '••••••••••••';
  btn.textContent = masked ? 'Hide' : 'Show';
}

function copyPassword(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  navigator.clipboard.writeText(site.password);
  showToast('Password copied', 'success');
}

function renderSiteHistory(history) {
  if (!history?.length) return '<p class="muted">No password history yet</p>';
  return `<ul class="history-list">${history
    .slice(0, 5)
    .map((item) => `<li><strong>${item.note}</strong> · ${fmtDate(item.setAt)}</li>`)
    .join('')}</ul>`;
}

function renderSites() {
  const list = filterSitesByKeyword(pmSites, searchInput?.value || '');
  siteContainer.innerHTML = '';

  if (!list.length) {
    siteContainer.innerHTML = '<p class="empty">No matching results.</p>';
    return;
  }

  list.forEach((site) => {
    const card = document.createElement('article');
    card.className = 'siteCard';
    card.innerHTML = `
      <h3>
        <span>${site.favorite ? '⭐ ' : ''}${site.name}</span>
        <button onclick="toggleFavoriteSite('${site.id}')">${site.favorite ? 'Unstar' : 'Star'}</button>
      </h3>
      <p><strong>URL:</strong> ${site.url}</p>
      <p><strong>User:</strong> ${site.username}</p>
      <p><strong>Password:</strong> <span id="pass_${site.id}" data-password="${site.password.replace(/"/g, '&quot;')}" data-masked="true">••••••••••••</span>
      <button onclick="togglePassword(this, '${site.id}')">Show</button></p>
      <p><strong>Password Updated:</strong> ${fmtDate(site.passwordUpdatedAt)}</p>
      <div class="row">
        <button onclick="copyPassword('${site.id}')">Copy</button>
        <button onclick="openEditForm('${site.id}')">Edit</button>
        <button class="danger" onclick="deleteSiteById('${site.id}')">Delete</button>
      </div>
      <details>
        <summary>Password History</summary>
        ${renderSiteHistory(site.passwordHistory)}
      </details>
    `;
    siteContainer.appendChild(card);
  });
}

function renderPasswordHistoryView() {
  if (!historyContainer) return;

  if (!pmSites.length) {
    historyContainer.innerHTML = '<p class="empty">No sites/password history yet.</p>';
    return;
  }

  historyContainer.innerHTML = pmSites
    .map((site) => {
      const items = (site.passwordHistory || [])
        .map((entry) => `<li><span>${fmtDate(entry.setAt)}</span> — <strong>${entry.note}</strong> (${entry.password.length} chars)</li>`)
        .join('') || '<li>No password updates yet.</li>';

      return `
        <article class="siteCard">
          <h3>${site.name}</h3>
          <p><strong>URL:</strong> ${site.url}</p>
          <p><strong>Username:</strong> ${site.username}</p>
          <ul class="history-list">${items}</ul>
        </article>
      `;
    })
    .join('');
}

function showView(route) {
  showLoader();
  const views = document.querySelectorAll('.view');
  views.forEach((view) => view.classList.remove('active'));

  const target = document.getElementById(`view-${route}`) || document.getElementById('view-home');
  target.classList.add('active');

  if (route === 'history') renderPasswordHistoryView();
  if (route === 'settings') initSettingsView();
  hideLoader();
}

function initRouter() {
  const route = (window.location.hash || '#home').replace('#', '');
  showView(route);

  window.addEventListener('hashchange', () => {
    const next = (window.location.hash || '#home').replace('#', '');
    showView(next);
  });
}

function initSettingsView() {
  const toggle = document.getElementById('autoBackupToggle');
  if (!toggle) return;
  const settings = PMStorage.loadSettings();
  toggle.checked = !!settings.autoBackup;
  toggle.onchange = () => {
    PMStorage.saveSettings({ ...PMStorage.loadSettings(), autoBackup: toggle.checked });
    showToast(`Auto backup ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
  };
}

function clearAll() {
  if (!confirm('Delete all data?')) return;
  localStorage.removeItem('pm_sites_v2');
  localStorage.removeItem('pm_settings_v2');
  localStorage.removeItem('pm_auto_backup_v2');
  pmSites = [];
  window.pmSites = pmSites;
  renderSites();
  renderPasswordHistoryView();
  showToast('All data cleared', 'error');
}

if (searchInput) searchInput.addEventListener('input', renderSites);
window.onclick = (e) => { if (e.target === modal) closeModal(); };

window.openAddForm = openAddForm;
window.openEditForm = openEditForm;
window.closeModal = closeModal;
window.saveSite = saveSite;
window.deleteSiteById = deleteSiteById;
window.toggleFavoriteSite = toggleFavoriteSite;
window.togglePassword = togglePassword;
window.copyPassword = copyPassword;
window.clearAll = clearAll;

renderSites();
renderPasswordHistoryView();
initRouter();
runAutoBackup();
