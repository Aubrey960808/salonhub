renderNav(qs("type") === "salon" ? "salon" : qs("type") === "housecall" ? "housecall" : null);

const citySelect = document.getElementById("f-city");
allCities().forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c; opt.textContent = c;
  citySelect.appendChild(opt);
});

const typeSelect = document.getElementById("f-type");
const categorySelect = document.getElementById("f-category");
const categoryWrap = document.getElementById("f-category-wrap");
const sortSelect = document.getElementById("f-sort");

// seed filters from the query string
typeSelect.value = qs("type") || "";
categorySelect.value = qs("category") || "";
citySelect.value = qs("city") || "";
updateCategoryVisibility();
updateTitle();

typeSelect.addEventListener("change", () => { updateCategoryVisibility(); updateTitle(); });

function updateCategoryVisibility() {
  categoryWrap.style.display = typeSelect.value === "housecall" ? "block" : "none";
}

function updateTitle() {
  const title = typeSelect.value === "housecall" ? "House-call providers"
    : typeSelect.value === "salon" ? "Salons"
    : "All providers";
  document.getElementById("page-title").textContent = title;
}

document.getElementById("filter-form").addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});

function runSearch() {
  let providers = DB.getUsers().filter((u) => u.role === "provider");

  if (typeSelect.value) providers = providers.filter((p) => p.providerType === typeSelect.value);
  if (typeSelect.value === "housecall" && categorySelect.value) {
    providers = providers.filter((p) => p.category === categorySelect.value);
  }
  if (citySelect.value) providers = providers.filter((p) => p.city === citySelect.value);

  const minPrice = (p) => (p.services.length ? Math.min(...p.services.map((s) => s.price)) : Infinity);
  if (sortSelect.value === "price-asc") providers.sort((a, b) => minPrice(a) - minPrice(b));
  else if (sortSelect.value === "price-desc") providers.sort((a, b) => minPrice(b) - minPrice(a));
  else providers.sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById("result-count").textContent =
    `${providers.length} provider${providers.length === 1 ? "" : "s"} found`;
  renderListing("results", providers, "No providers match those filters yet — try widening your search.");
}

runSearch();
