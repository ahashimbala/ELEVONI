import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import MarketplaceProductCard from "../../components/MarketplaceProductCard/MarketplaceProductCard";
import { fetchPublicProducts } from "../../utils/marketplace.js";
import "./Marketplace.css";
import marketplace from "../../assets/Farm-to-Market Animal Delivery.png"

const CATEGORIES = [
  "All sectors",
  "Catfish & Aquaculture",
  "Fishery Products & Equipment",
  "Poultry & Eggs",
  "Livestock & Meat",
  "Food Crops",
];

const ALL_TYPES = "All types";

const SUBCATEGORIES = {
  "All sectors": [
    ALL_TYPES,
    "Catfish",
    "Tilapia",
    "Other Fish",
    "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Hatchery Services", "Aquaculture Consulting", "Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services",
    "Poultry",
    "Cattle",
    "Sheep",
    "Goats",
    "Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch",
  ],
  "Catfish & Aquaculture": [
    ALL_TYPES,
    "Catfish",
    "Tilapia",
    "Other Fish",
    "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Hatchery Services", "Aquaculture Consulting",
  ],
  "Fishery Products & Equipment": [ALL_TYPES, "Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services"],
  "Poultry & Eggs": [ALL_TYPES, "Poultry"],
  "Livestock & Meat": [ALL_TYPES, "Cattle", "Sheep", "Goats"],
  "Food Crops": [ALL_TYPES, "Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch"],
};

const CONDITIONS = [
  "All conditions",
  "Live",
  "Fresh",
  "Frozen",
  "Smoked",
  "Dried",
  "Processed",
];

const subcategoryOptionsFor = (category) =>
  SUBCATEGORIES[category] || SUBCATEGORIES["All sectors"];

const Marketplace = () => {
  const { url } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch.trim());
  const [category, setCategory] = useState("All sectors");
  const [sectorFilter, setSectorFilter] = useState("All sectors");
  const [subcategory, setSubcategory] = useState(searchParams.get("subcategory") || ALL_TYPES);
  const [condition, setCondition] = useState("All conditions");
  const [species, setSpecies] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const value = searchParams.get("search") || "";
    // Sync when a new search URL is opened or the user navigates back/forward.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(value);
    setSearch(value.trim());
    setSubcategory(searchParams.get("subcategory") || ALL_TYPES);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (subcategoryOptionsFor(category).includes(subcategory)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubcategory(ALL_TYPES);
  }, [category, subcategory]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let current = true;
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchPublicProducts({
          url,
          page,
          limit: 12,
          search,
          category: category !== "All sectors" ? category : undefined,
          sector: sectorFilter !== "All sectors" ? sectorFilter : undefined,
          subcategory: subcategory !== ALL_TYPES ? subcategory : undefined,
          condition: condition !== "All conditions" ? condition : undefined,
          species: category === "Catfish & Aquaculture" || category === "Fishery Products & Equipment" ? species : undefined,
          state: stateFilter || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
        });
        if (!current) return;
        setProducts(result.products);
        setTotal(result.total);
        setPages(result.pages);
      } catch (loadError) {
        if (!current) return;
        setProducts([]);
        setTotal(0);
        setPages(0);
        setError(
          loadError.response?.data?.message ||
            loadError.message ||
            "We couldn’t load marketplace listings. Please try again.",
        );
      } finally {
        if (current) setLoading(false);
      }
    };
    loadProducts();
    return () => { current = false; };
  }, [url, search, category, sectorFilter, subcategory, condition, species, stateFilter, minPrice, maxPrice, page, refresh]);

  return (
    <main className="marketplace-page">
      <Helmet>
        <title>Farm Marketplace | Elevoni Farms</title>
        <meta name="description" content="Explore marketplace listings from approved farms. Confirm availability, price and delivery before ordering." />
      </Helmet>

      <section className="marketplace-hero">
        <div className="marketplace-hero-copy">
          <p className="marketplace-eyebrow">Beyond the Elevoni catalogue</p>
          <h1>Discover livestock, aquaculture and fisheries products from reviewed vendors.</h1>
          <p>Explore products listed by vendors whose applications and products have passed the relevant review steps. Confirm availability, final price and delivery arrangements with Elevoni before ordering.</p>
          <Link to="/sell-with-elevoni" className="marketplace-sell-link">Are you a farmer? Apply to sell <span aria-hidden="true">→</span></Link>
        </div>
        <div>
         <img src={marketplace} alt="" />
        </div>
      </section>

      <section className="marketplace-catalogue" aria-labelledby="marketplace-listings-title">
        <div className="marketplace-section-heading">
          <div>
            <p className="marketplace-eyebrow">Marketplace</p>
            <h2 id="marketplace-listings-title">Farm listings</h2>
          </div>
          <p className="marketplace-count">{loading ? "Updating listings…" : `${total} ${total === 1 ? "listing" : "listings"}`}</p>
        </div>

        <div className="marketplace-filters">
          <label className="marketplace-search-label">
            <span>Search products</span>
            <input value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setPage(1); }} placeholder="Try catfish, tilapia, poultry, cattle…" type="search" />
          </label>
          <label className="marketplace-category-label">
            <span>Sector</span>
            <select value={sectorFilter} onChange={(event) => { setSectorFilter(event.target.value); setPage(1); }}>
              {['All sectors', 'Livestock', 'Aquaculture', 'Fisheries', 'Food Crops'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="marketplace-category-label">
            <span>Product category</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item === 'All sectors' ? 'All categories' : item}</option>)}
            </select>
          </label>
          <label className="marketplace-category-label">
            <span>Product type</span>
            <select value={subcategory} onChange={(event) => { setSubcategory(event.target.value); setPage(1); }}>
              {subcategoryOptionsFor(category).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          {(sectorFilter === "All sectors" || sectorFilter === "Aquaculture" || sectorFilter === "Fisheries" || category === "Catfish & Aquaculture" || category === "Fishery Products & Equipment") && <label className="marketplace-category-label">
            <span>Fish condition</span>
            <select value={condition} onChange={(event) => { setCondition(event.target.value); setPage(1); }}>
              {CONDITIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>}
          {(category === "Catfish & Aquaculture" || category === "Fishery Products & Equipment" || category === "All sectors") && <label className="marketplace-category-label"><span>Species</span><input value={species} onChange={(event) => { setSpecies(event.target.value); setPage(1); }} placeholder="e.g. catfish, tilapia" /></label>}
          <label className="marketplace-category-label"><span>State / location</span><input value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }} placeholder="e.g. Abuja, Lagos" /></label>
          <label className="marketplace-category-label"><span>Minimum price (₦)</span><input type="number" min="0" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} /></label>
          <label className="marketplace-category-label"><span>Maximum price (₦)</span><input type="number" min="0" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} /></label>
        </div>

        {loading && <div className="marketplace-state" role="status"><span className="marketplace-spinner" />Loading available listings…</div>}
        {!loading && error && <div className="marketplace-state marketplace-state-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>}
        {!loading && !error && products.length === 0 && (
          <div className="marketplace-empty">
            <span className="marketplace-empty-icon" aria-hidden="true">✳</span>
            <h3>No listings match this search yet.</h3>
            <p>Try another search or category. New listings appear after the vendor and product review steps are complete.</p>
            <button type="button" onClick={() => { setSearchInput(""); setCategory("All sectors"); setSubcategory(ALL_TYPES); setCondition("All conditions"); setPage(1); }}>Clear filters</button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="marketplace-grid">
            {products.map((product) => (
              <MarketplaceProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        {!loading && !error && pages > 1 && (
          <nav className="marketplace-pagination" aria-label="Marketplace pages">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page >= pages}>Next</button>
          </nav>
        )}
        <p className="marketplace-disclaimer">Marketplace enquiries are not completed orders. Confirm quantity, final price, payment and delivery arrangements before making payment.</p>
      </section>
    </main>
  );
};

export default Marketplace;
