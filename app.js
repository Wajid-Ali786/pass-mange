let pmSites = [];
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
const siteCategoryInput = document.getElementById("siteCategory");
const siteCategoryColorInput = document.getElementById("siteCategoryColor");
const searchInput = document.getElementById("searchInput");
const favoritesOnlyInput = document.getElementById("favoritesOnly");
const categoryFilterInput = document.getElementById("categoryFilter");
const pageSizeInput = document.getElementById("pageSizeSelect");
const sortInput = document.getElementById("sortSelect");
const paginationActions = document.getElementById("pagination-actions");
const pageLabel = document.getElementById("pageLabel");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const categorySummary = document.getElementById("categorySummary");
const categoryListDatalist = document.getElementById("categoryList");
const siteContainer = document.getElementById("sitesContainer");
const historyModal = document.getElementById("passwordHistoryModal");
const historyBody = document.getElementById("passwordHistoryBody");

const state = {
  keyword: "",
  sortBy: PMStorage.loadSettings().sortBy || "manual",
  favoritesOnly: !!PMStorage.loadSettings().favoritesOnly,
  categoryFilter: PMStorage.loadSettings().categoryFilter || "all",
  pageSize: Number(PMStorage.loadSettings().pageSize) || 10,
  page: 1,
};

let editingSiteId = null;
let draggingId = null;

function persistData() {
  PMStorage.saveSites(pmSites);
  PMStorage.saveGlobalHistory(pmGlobalHistory);
  PMStorage.saveSettings({
    ...PMStorage.loadSettings(),
    sortBy: state.sortBy,
    favoritesOnly: state.favoritesOnly,
    categoryFilter: state.categoryFilter,
    pageSize: state.pageSize,
  });
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
  siteCategoryInput.value = "General";
  siteCategoryColorInput.value = "#3964ff";
  modal.style.display = "flex";
}

async function openEditForm(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  editingSiteId = id;
  modalTitle.textContent = "Edit Password";
  siteNameInput.value = site.name;
  siteURLInput.value = site.url;
  siteUserInput.value = site.username;
  sitePassInput.value = await PMEncryption.decryptText(site.passwordEnc);
  passDateInput.value = (site.passwordUpdatedAt || "").slice(0, 16);
  favoriteInput.checked = site.favorite;
  siteCategoryInput.value = site.category || "General";
  siteCategoryColorInput.value = site.categoryColor || "#3964ff";
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

async function saveSite() {
  const data = {
    name: siteNameInput.value,
    url: siteURLInput.value,
    username: siteUserInput.value,
    password: sitePassInput.value,
    customPassDate: passDateInput.value
      ? new Date(passDateInput.value).toISOString()
      : PMStorage.nowISO(),
    favorite: favoriteInput.checked,
    category: siteCategoryInput.value.trim() || "General",
    categoryColor: siteCategoryColorInput.value,
  };

  if (!data.name || !data.url || !data.username || !data.password) {
    showToast("Please fill all fields", "error");
    return;
  }

  if (!editingSiteId) {
    const site = await PMStorage.createSite(data);
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
    const oldPassword = await PMEncryption.decryptText(site.passwordEnc);

    site.name = data.name.trim();
    site.url = data.url.trim();
    site.username = data.username.trim();
    site.passwordEnc = await PMEncryption.encryptText(data.password);
    site.favorite = data.favorite;
    site.category = data.category;
    site.categoryColor = data.categoryColor;
    site.passwordUpdatedAt = data.customPassDate;
    site.updatedAt = PMStorage.nowISO();

    if (oldPassword !== data.password) {
      await PMHistory.addPasswordHistoryEntry(
        site,
        data.password,
        data.customPassDate,
      );
      PMHistory.buildSiteHistoryEntry(
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

    PMHistory.buildSiteHistoryEntry(site, "updated", "Entry updated");
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
  const deleteModal = document.getElementById("deleteModal");
  const text = document.getElementById("modalText");
  text.textContent = `Are you sure you want to delete "${siteName}"?`;
  deleteModal.style.display = "flex";
  document.getElementById("confirmBtn").onclick = () => {
    deleteSiteById(siteId);
    deleteModal.style.display = "none";
  };
  document.getElementById("cancelBtn").onclick = () => {
    deleteModal.style.display = "none";
  };
}

function setLastUsed(site) {
  site.lastUsedAt = PMStorage.nowISO();
  site.updatedAt = PMStorage.nowISO();
}

function toggleFavoriteSite(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  site.favorite = !site.favorite;
  setLastUsed(site);
  PMHistory.buildSiteHistoryEntry(
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
}

function togglePinSite(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  site.pinned = !site.pinned;
  PMHistory.buildSiteHistoryEntry(
    site,
    site.pinned ? "pinned" : "unpinned",
    "Pin toggled",
  );
  persistData();
  renderSites();
}

function toggleCollapseSite(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  site.collapsed = !site.collapsed;
  persistData();
  renderSites();
}

async function togglePassword(btn, id) {
  const input = document.getElementById(`pass_${id}`);
  const site = pmSites.find((s) => s.id === id);
  if (!input || !site) return;

  if (input.type === "password") {
    input.value = await PMEncryption.decryptText(site.passwordEnc);
    input.type = "text";
    btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    setLastUsed(site);
    persistData();
  } else {
    input.type = "password";
    input.value = "••••••••";
    btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  }
}

async function copyPassword(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;
  const plain = await PMEncryption.decryptText(site.passwordEnc);
  navigator.clipboard.writeText(plain);
  setLastUsed(site);
  persistData();
  showToast('<i class="fa-solid fa-copy"></i> Password copied', "success");
}

async function openPasswordHistory(id) {
  const site = pmSites.find((s) => s.id === id);
  if (!site) return;

  const items = await Promise.all(
    (site.passwordHistory || []).map(async (h) => {
      const plain = await PMEncryption.decryptText(h.passwordEnc);
      const masked = plain
        ? `${"•".repeat(Math.max(4, plain.length))}`
        : "(empty)";
      return `
      <article class="history-revert-item">
        <div>
          <strong>${masked}</strong>
          <p>${PMUI.fmtDate(h.changedAt)}</p>
        </div>
        <button onclick="revertPassword('${site.id}','${h.id}')">Revert</button>
      </article>
    `;
    }),
  );

  historyBody.innerHTML =
    items.join("") || '<p class="empty">No password history yet.</p>';
  historyModal.style.display = "flex";
}

async function revertPassword(siteId, historyId) {
  const site = pmSites.find((s) => s.id === siteId);
  if (!site) return;
  const entry = (site.passwordHistory || []).find((h) => h.id === historyId);
  if (!entry) return;
  const plain = await PMEncryption.decryptText(entry.passwordEnc);
  site.passwordEnc = await PMEncryption.encryptText(plain);
  site.passwordUpdatedAt = PMStorage.nowISO();
  site.updatedAt = PMStorage.nowISO();
  await PMHistory.addPasswordHistoryEntry(site, plain, PMStorage.nowISO());
  PMHistory.buildSiteHistoryEntry(
    site,
    "password_reverted",
    "Password reverted from history",
  );
  PMStorage.addGlobalHistory(
    pmGlobalHistory,
    site,
    "password_reverted",
    "Password reverted from history",
  );
  persistData();
  historyModal.style.display = "none";
  renderSites();
  showToast("Password reverted", "success");
}

function updateCategoryUI(filteredList) {
  const counts = PMFilters.categoryCounts(pmSites);
  const categories = Object.keys(counts).sort();

  if (!categories.includes(state.categoryFilter)) {
    state.categoryFilter = "all";
  }

  categoryFilterInput.innerHTML =
    `<option value="all">All Categories</option>` +
    categories
      .map(
        (cat) => `<option value="${PMUI.esc(cat)}">${PMUI.esc(cat)}</option>`,
      )
      .join("");

  categoryFilterInput.value = state.categoryFilter;

  categoryListDatalist.innerHTML = categories
    .map((cat) => `<option value="${PMUI.esc(cat)}"></option>`)
    .join("");

  categorySummary.innerHTML = categories.length
    ? categories
        .map(
          (cat) =>
            `<span class="category-count-pill">${PMUI.esc(cat)}: ${counts[cat]}</span>`,
        )
        .join("")
    : '<span class="muted">No categories yet</span>';
}

function pageSlice(list) {
  const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  return {
    chunk: list.slice(start, start + state.pageSize),
    totalPages,
  };
}

function renderSites() {
  state.keyword = searchInput?.value || "";

  updateCategoryUI(pmSites);
  const filtered = PMFilters.filterSites(pmSites, state);

  const { chunk, totalPages } = pageSlice(filtered);
  if (!filtered.length) {
    siteContainer.innerHTML = '<p class="empty">No matching results.</p>';
    return;
  }

  pageLabel.textContent = `Page ${state.page} / ${totalPages}`;

  if (!chunk.length) return;

  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= totalPages;

  // check if both buttons disabled
  if (prevPageBtn.disabled && nextPageBtn.disabled) {
    paginationActions.classList.add("no-pagination");
  } else {
    paginationActions.classList.remove("no-pagination");
  }

  siteContainer.innerHTML = "";
  chunk.forEach((site) => {
    const card = document.createElement("article");
    card.className = `siteCard ${site.collapsed ? "collapsed" : ""}`;
    card.draggable = state.sortBy === "manual";
    card.dataset.id = site.id;

    card.innerHTML = `
      <h3>
        <span>${PMUI.esc(site.name)}</span>
        <div class="card-head-actions">
          <button onclick="togglePinSite('${site.id}')" class="mark-card-pin ${site.pinned ? "pinned" : "unpinned"}">
            <i class="fa-solid fa-thumbtack"></i>
          </button>
          <button onclick="toggleFavoriteSite('${site.id}')" class="mark-star-unstar ${site.favorite ? "star" : "unstar"}">
            ${site.favorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'}
          </button>
          <button onclick="toggleCollapseSite('${site.id}')" class="ghost-btn">
            <i class="fa-solid ${site.collapsed ? "fa-angles-down" : "fa-angles-up"}"></i>
          </button>
        </div>
      </h3>
      <p class="url"><strong>URL:</strong> <a href="${PMUI.esc(site.url)}" target="_blank">${PMUI.esc(site.url)}</a></p>
      <div class="category-badge" style="--badge-color:${PMUI.esc(site.categoryColor || "#3964ff")}">${PMUI.esc(site.category || "General")}</div>
      <div class="collapse-content">
        <p class="user-name"><strong>User Name:</strong> <input type="text" value="${PMUI.esc(site.username)}" readonly class="user-input"></p>
        <div class="pass-row">
          <span class="pass-text">Password:</span>
          <div class="password-box">
            <button onclick="copyPassword('${site.id}')" class="copy-btn"><i class="fa-solid fa-copy"></i></button>
            <input type="password" id="pass_${site.id}" value="••••••••" readonly class="password-input">
            <button onclick="togglePassword(this,'${site.id}')" class="toggle-btn"><i class="fa-regular fa-eye"></i></button>
          </div>
        </div>
        <p><strong>Password Updated:</strong> ${PMUI.fmtDate(site.passwordUpdatedAt)}</p>
        <p><strong>Updated:</strong> ${PMUI.fmtDate(site.updatedAt)}</p>
        <div class="row">
          <button onclick="openEditForm('${site.id}')"><i class="fa-solid fa-edit"></i></button>
          <button class="danger" onclick="showDeleteModal('${site.id}', '${PMUI.esc(site.name)}')"><i class="fa-solid fa-trash"></i></button>
          <button class="history-open-btn" onclick="openPasswordHistory('${site.id}')"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
        </div>
      </div>
    `;

    card.addEventListener("dragstart", () => {
      draggingId = site.id;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      draggingId = null;
      card.classList.remove("dragging");
    });

    card.addEventListener("dragover", (e) => {
      if (state.sortBy !== "manual") return;
      e.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () =>
      card.classList.remove("drag-over"),
    );
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      if (!draggingId || draggingId === site.id) return;
      reorderByDrag(draggingId, site.id);
    });

    siteContainer.appendChild(card);
  });
}

function reorderByDrag(fromId, toId) {
  const visibleManual = PMFilters.filterSites(pmSites, {
    ...state,
    favoritesOnly: false,
    categoryFilter: "all",
    keyword: "",
    sortBy: "manual",
  });
  const fromIndex = visibleManual.findIndex((s) => s.id === fromId);
  const toIndex = visibleManual.findIndex((s) => s.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;

  const [moved] = visibleManual.splice(fromIndex, 1);
  visibleManual.splice(toIndex, 0, moved);
  visibleManual.forEach((site, index) => {
    const ref = pmSites.find((s) => s.id === site.id);
    ref.manualOrder = index;
  });

  persistData();
  renderSites();
}

function bindEvents() {
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  searchInput.addEventListener("input", () => {
    state.page = 1;
    renderSites();
  });
  favoritesOnlyInput.checked = state.favoritesOnly;
  favoritesOnlyInput.addEventListener("change", () => {
    state.favoritesOnly = favoritesOnlyInput.checked;
    state.page = 1;
    renderSites();
  });

  sortInput.value = state.sortBy;
  sortInput.addEventListener("change", () => {
    state.sortBy = sortInput.value;
    renderSites();
  });

  categoryFilterInput.addEventListener("change", () => {
    state.categoryFilter = categoryFilterInput.value;
    state.page = 1;
    renderSites();
  });

  pageSizeInput.value = String(state.pageSize);
  pageSizeInput.addEventListener("change", () => {
    state.pageSize = Number(pageSizeInput.value);
    state.page = 1;
    renderSites();
  });

  prevPageBtn.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderSites();
  });

  nextPageBtn.addEventListener("click", () => {
    state.page += 1;
    renderSites();
  });

  document
    .getElementById("closePasswordHistory")
    .addEventListener("click", () => {
      historyModal.style.display = "none";
    });

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
    if (e.target === historyModal) historyModal.style.display = "none";
  });
}

async function init() {
  pmSites = await PMStorage.loadSites();
  window.pmSites = pmSites;

  if (!pmSites.some((s) => s.category === state.categoryFilter)) {
    state.categoryFilter = "all";
  }

  bindEvents();
  renderSites();
  runAutoBackup();
}

window.openAddForm = openAddForm;
window.openEditForm = openEditForm;
window.closeModal = closeModal;
window.saveSite = saveSite;
window.deleteSiteById = deleteSiteById;
window.showDeleteModal = showDeleteModal;
window.toggleFavoriteSite = toggleFavoriteSite;
window.togglePinSite = togglePinSite;
window.toggleCollapseSite = toggleCollapseSite;
window.togglePassword = togglePassword;
window.copyPassword = copyPassword;
window.openPasswordHistory = openPasswordHistory;
window.revertPassword = revertPassword;

init();
