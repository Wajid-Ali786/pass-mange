let pmSites = PMStorage.loadSites();
let pmGlobalHistory = PMStorage.loadGlobalHistory();
window.pmSites = pmSites;
window.pmGlobalHistory = pmGlobalHistory;

const modal = document.getElementById("siteModal");
const modalTitle = document.getElementById("modalTitle");
const siteNameInput = document.getElementById("siteName");
const siteURLInput = document.getElementById("siteURL");
const siteUserInput = document.getElementById("siteUser");
const sitePassInput = document.getElementById("sitePass");
const passDateInput = document.getElementById("passDate");
const favoriteInput = document.getElementById("favoriteCheck");
const searchInput = document.getElementById("searchInput");
const siteContainer = document.getElementById("sitesContainer");

let editingSiteId = null;

function persistData() {
  PMStorage.saveSites(pmSites);
  PMStorage.saveGlobalHistory(pmGlobalHistory);
  runAutoBackup();
}

function openAddForm() {
  editingSiteId = null;
  modalTitle.textContent = "Add Password";
  siteNameInput.value = "";
  siteURLInput.value = "";
  siteUserInput.value = "";
  sitePassInput.value = "";
  passDateInput.value = new Date().toISOString().slice(0, 16);
  favoriteInput.checked = false;
  modal.style.display = "flex";
}

function openEditForm(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  editingSiteId = id;
  modalTitle.textContent = "Edit Password";
  siteNameInput.value = site.name;
  siteURLInput.value = site.url;
  siteUserInput.value = site.username;
  sitePassInput.value = site.password;
  passDateInput.value = (site.passwordUpdatedAt || "").slice(0, 16);
  favoriteInput.checked = site.favorite;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

function buildSiteHistoryEntry(site, action, details, at) {
  site.history.unshift({
    id: PMStorage.uid(),
    action,
    details,
    at: at || PMStorage.nowISO(),
  });
}

function saveSite() {
  const data = {
    name: siteNameInput.value,
    url: siteURLInput.value,
    username: siteUserInput.value,
    password: sitePassInput.value,
    customPassDate: passDateInput.value
      ? new Date(passDateInput.value).toISOString()
      : PMStorage.nowISO(),
    favorite: favoriteInput.checked,
  };

  if (!data.name || !data.url || !data.username || !data.password) {
    showToast("Please fill all fields", "error");
    return;
  }

  if (!editingSiteId) {
    const site = PMStorage.createSite(data);
    pmSites.unshift(site);
    PMStorage.addGlobalHistory(
      pmGlobalHistory,
      site,
      "created",
      "Created new entry",
    );
    showToast("Entry added", "success");
  } else {
    const site = pmSites.find((s) => s.id === editingSiteId);
    if (!site) return;
    const oldPassword = site.password;
    const oldFavorite = site.favorite;

    site.name = data.name.trim();
    site.url = data.url.trim();
    site.username = data.username.trim();
    site.password = data.password;
    site.favorite = data.favorite;
    site.passwordUpdatedAt = data.customPassDate;
    site.updatedAt = PMStorage.nowISO();

    if (oldPassword !== data.password) {
      buildSiteHistoryEntry(
        site,
        "password_changed",
        "Password updated",
        data.customPassDate,
      );
      PMStorage.addGlobalHistory(
        pmGlobalHistory,
        site,
        "password_changed",
        "Password updated",
      );
    }

    if (oldFavorite !== data.favorite) {
      PMStorage.addGlobalHistory(
        pmGlobalHistory,
        site,
        data.favorite ? "favorited" : "unfavorited",
        "Favorite status changed",
      );
    }

    buildSiteHistoryEntry(site, "updated", "Entry updated");
    PMStorage.addGlobalHistory(
      pmGlobalHistory,
      site,
      "updated",
      "Entry updated",
    );
    showToast("Entry updated", "success");
  }

  persistData();
  renderSites();
  closeModal();
}

function deleteSiteById(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  pmSites = pmSites.filter((s) => s.id !== id);
  window.pmSites = pmSites;
  PMStorage.addGlobalHistory(pmGlobalHistory, site, "deleted", "Entry removed");
  persistData();
  renderSites();
  showToast("Entry deleted", "error");
}

function showDeleteModal(siteId, siteName) {
  const modal = document.getElementById("deleteModal");
  const text = document.getElementById("modalText");
  text.textContent = `Are you sure you want to delete "${siteName}"?`;

  modal.style.display = "block";

  document.getElementById("confirmBtn").onclick = () => {
    deleteSiteById(siteId);
    modal.style.display = "none";
  };
  document.getElementById("cancelBtn").onclick = () => {
    modal.style.display = "none";
  };
}

function toggleFavoriteSite(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  site.favorite = !site.favorite;
  site.updatedAt = PMStorage.nowISO();
  buildSiteHistoryEntry(
    site,
    site.favorite ? "favorited" : "unfavorited",
    "Favorite toggled",
  );
  PMStorage.addGlobalHistory(
    pmGlobalHistory,
    site,
    site.favorite ? "favorited" : "unfavorited",
    "Favorite toggled",
  );
  persistData();
  renderSites();
  if (site.favorite) {
    showToast("Added to favorites", "success");
  } else {
    showToast("Removed from favorites", "error");
  }
}

function togglePassword(btn, id) {
  const input = document.getElementById(`pass_${id}`);
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
  } else {
    input.type = "password";
    btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  }
}

function copyPassword(id) {
  const input = document.getElementById(`pass_${id}`);
  navigator.clipboard.writeText(input.value);
  showToast('<i class="fa-solid fa-copy"></i> Password copied', "success");
}

function renderSiteHistory(history) {

  if (!history || history.length === 0) {
    return `<div class="history-empty">No history yet</div>`;
  }

  return history.map(h => `
    <div class="history-item">

      <div class="history-icon">
        <i class="fa-solid fa-clock"></i>
      </div>

      <div class="history-content">
        <div class="history-action">${h.action}</div>
        <div class="history-details">${h.details || ""}</div>
        <div class="history-time">${new Date(h.at).toLocaleString()}</div>
      </div>

    </div>
  `).join("");

}

function openHistory(id){
  document.getElementById(`history_${id}`).classList.add("show");
}

function closeHistory(id){
  document.getElementById(`history_${id}`).classList.remove("show");
}

function renderSites() {
  const list = filterSitesByKeyword(pmSites, searchInput?.value || "");
  siteContainer.innerHTML = "";

  if (!list.length) {
    siteContainer.innerHTML = '<p class="empty">No matching results.</p>';
    return;
  }

  list.forEach((site) => {
    const card = document.createElement("article");
    card.className = "siteCard";
    card.innerHTML = `
      <h3>
        <span>${site.name}</span>
        <button onclick="toggleFavoriteSite('${site.id}')" class="mark-star-unstar ${site.favorite ? "star" : "unstar"}">${site.favorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'}</button>
      </h3>
      <p class="url"><strong>URL:</strong><a href=" ${site.url}" target="_blank"> ${site.url}</a></p>
      <p class="user-name"><strong>User Name:</strong> <input type="text" value="${site.username}" readonly class="user-input"></p>
      <div class="pass-row">
        <span class="pass-text">Password:</span>
        <div class="password-box">
          <button onclick="copyPassword('${site.id}')" class="copy-btn">
            <i class="fa-solid fa-copy"></i>
          </button>
          <input type="password" id="pass_${site.id}" value="${site.password}" readonly class="password-input">
          <button onclick="togglePassword(this,'${site.id}')" class="toggle-btn">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
      </div>
      <p><strong>Password Updated:</strong> ${fmtDate(site.passwordUpdatedAt)}</p>
      <p><strong>Updated:</strong> ${fmtDate(site.updatedAt)}</p>
      <div class="row">
        <button onclick="openEditForm('${site.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="danger" onclick="showDeleteModal('${site.id}', '${site.name}')"><i class="fa-solid fa-trash"></i></button>
        <button class="history-open-btn" onclick="openHistory('${site.id}')">
          <i class="fa-solid fa-clock-rotate-left"></i> History
        </button>
      </div>
      <div class="history-modal" id="history_${site.id}">
        <div class="history-modal-box">
          <div class="history-modal-header">
            <span>Site History</span>
            <button onclick="closeHistory('${site.id}')" class="history-close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="history-modal-body">
            ${renderSiteHistory(site.history)}
          </div>
        </div>
      </div>
    `;
    siteContainer.appendChild(card);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", renderSites);
}

window.onclick = (e) => {
  if (e.target === modal) closeModal();
};

window.openAddForm = openAddForm;
window.openEditForm = openEditForm;
window.closeModal = closeModal;
window.saveSite = saveSite;
window.deleteSiteById = deleteSiteById;
window.toggleFavoriteSite = toggleFavoriteSite;
window.togglePassword = togglePassword;
window.copyPassword = copyPassword;

renderSites();
runAutoBackup();
