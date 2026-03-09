function filterSitesByKeyword(sites, keyword) {
  const query = (keyword || '').toLowerCase().trim();
  if (!query) return sites;

  return sites.filter((site) => {
    const haystack = [
      site.name,
      site.url,
      site.username,
      site.password,
      site.passwordUpdatedAt,
      site.updatedAt,
      site.createdAt
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

window.filterSitesByKeyword = filterSitesByKeyword;
