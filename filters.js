function filterSites(sites, state) {
  const query = (state.keyword || '').toLowerCase().trim();
  let list = [...sites];

  if (query) {
    list = list.filter((site) => [site.name, site.url, site.username, site.passwordUpdatedAt, site.updatedAt, site.createdAt, site.category]
      .join(' ')
      .toLowerCase()
      .includes(query));
  }

  if (state.favoritesOnly) list = list.filter((site) => site.favorite);
  if (state.categoryFilter && state.categoryFilter !== 'all') list = list.filter((site) => site.category === state.categoryFilter);

  list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    if (state.sortBy === 'name') return a.name.localeCompare(b.name);
    if (state.sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (state.sortBy === 'used') return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);

    return (a.manualOrder || 0) - (b.manualOrder || 0);
  });

  return list;
}

function categoryCounts(sites) {
  return sites.reduce((acc, site) => {
    const key = site.category || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

window.PMFilters = {
  filterSites,
  categoryCounts,
};
