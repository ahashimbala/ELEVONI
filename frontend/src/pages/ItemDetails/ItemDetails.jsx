import { useContext, useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import ProductMediaGallery, { buildProductGallery } from "../../components/ProductMediaGallery/ProductMediaGallery.jsx";
import "./ItemDetails.css";
import getProductPrice from "../../utils/pricing";
import { ELEVONI_WHATSAPP_PHONE } from "../../config/contact.js";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fish_list, cartItems, setCartQuantity, updateCartQuantity, url } =
    useContext(StoreContext);

  const [remoteLookup, setRemoteLookup] = useState({
    id: null,
    product: null,
    error: "",
  });

  const remoteProduct = remoteLookup.id === id ? remoteLookup.product : null;
  const remoteLookupError = remoteLookup.id === id ? remoteLookup.error : "";

  const item = fish_list.find((fish) => fish._id === id) || remoteProduct;

  useEffect(() => {
    let active = true;
    if (!id || fish_list.some((fish) => fish._id === id)) return undefined;
    axios
      .get(url + "/api/fish/" + id)
      .then(async (response) => {
        if (!active) return;
        if (response.data?.success && response.data.data) {
          setRemoteLookup({ id, product: response.data.data, error: "" });
          return;
        }
        const marketplace = await axios.get(url + "/api/products/" + id);
        if (!active) return;
        if (marketplace.data?.success && marketplace.data.data) {
          setRemoteLookup({ id, product: { ...marketplace.data.data, _source: "marketplace" }, error: "" });
        } else {
          setRemoteLookup({ id, product: null, error: "Product not found" });
        }
      })
      .catch(async (error) => {
        if (!active) return;
        try {
          const marketplace = await axios.get(url + "/api/products/" + id);
          if (!active) return;
          if (marketplace.data?.success && marketplace.data.data) {
            setRemoteLookup({ id, product: { ...marketplace.data.data, _source: "marketplace" }, error: "" });
            return;
          }
        } catch { /* fall through to a user-safe loading error */ }
        if (!active) return;
        setRemoteLookup({ id, product: null, error: error.response?.status === 404 ? "Product not found" : "This product could not be loaded. Please try again." });
      });
    return () => {
      active = false;
    };
  }, [id, fish_list, url]);

  const [draftQuantity, setDraftQuantity] = useState("0");
  const quantity = Number(item ? cartItems?.[item._id] || 0 : 0);
  const previousQuantity = useRef(quantity);
  const parsedQuantity = Number(draftQuantity);
  const isValidQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity >= 0;
  const previewQuantity = isValidQuantity ? parsedQuantity : 0;
  const hasQuantity = previewQuantity > 0;

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      setDraftQuantity(String(quantity));
      previousQuantity.current = quantity;
    }
  }, [quantity]);

  if (!item) {
    return (
      <div className="item-not-found">
        <h2>{remoteLookupError || "Loading..."}</h2>
        <button className="back-btn" onClick={() => navigate("/")}>
          Go Back Home
        </button>
      </div>
    );
  }

  const isMarketplaceProduct = item._source === "marketplace";
  const unit = item.unitOfMeasure || "kg";
  const currentPrice = isMarketplaceProduct ? Number(item.price || 0) : getProductPrice(item, Math.max(1, previewQuantity));
  const gallery = buildProductGallery(item, url);
  const schemaImage = gallery.find((media) => media.type === "image")?.src || gallery[0]?.src;

  const saveQuantity = async (event) => {
    event.preventDefault();
    if (!isValidQuantity || previewQuantity === 0) return;
    const saved = await setCartQuantity(item._id, parsedQuantity);
    if (saved !== true) {
      toast.error(saved === "forbidden"
        ? "This account is not authorized to use the cart. Please sign in again or contact support."
        : "Your quantity changed locally but could not be synced to your account.");
      return;
    }
    toast.success("Cart updated");
  };

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: item.name,
    image: schemaImage,
    description: item.description,
    category: item.category,
    ...(isMarketplaceProduct ? {} : {
      offers: {
        "@type": "Offer",
        url: `https://elevonifarms.vercel.app/product/${item._id}`,
        priceCurrency: "NGN",
        price: currentPrice,
      },
    }),
  };

  return (
    <div className="item-details">
      <Helmet>
        <title>{item.name} | Elevoni Farms</title>
        <meta
          name="description"
          content={`View product details, media and availability information for ${item.name} from Elevoni Farms.`}
        />
        <link
          rel="canonical"
          href={`https://elevonifarms.vercel.app/product/${item._id}`}
        />
        <meta
          property="og:title"
          content={`${item.name} - Elevoni Farms`}
        />
        <meta
          property="og:description"
          content={`View ${item.name} from Elevoni Farms, including product details, media, vendor and availability information.`}
        />
        <meta property="og:image" content={schemaImage} />
        <meta
          property="og:url"
          content={`https://elevonifarms.vercel.app/product/${item._id}`}
        />
      </Helmet>

      <script type="application/ld+json">{JSON.stringify(schemaData)}</script>

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="item-details-container">
        <div className="item-details-left">
          <ProductMediaGallery key={item._id} item={item} url={url} />
        </div>

        <div className="item-details-right">
          <h1>{item.name}</h1>

          <p className="item-details-category">
            Category: <span>{item.category}</span>
          </p>

          <div className="price-header-block">
            <p className="item-details-price">
              {isMarketplaceProduct ? `₦${currentPrice.toLocaleString("en-NG")}` : hasQuantity ? "₦" + currentPrice.toLocaleString("en-NG") : "Enter a quantity to see pricing"}
              {(isMarketplaceProduct || hasQuantity) && <span className="price-unit"> / {unit}</span>}
            </p>
            {!isMarketplaceProduct && hasQuantity && <p className="selected-price">{previewQuantity} kg × ₦{currentPrice.toLocaleString()} = ₦{(previewQuantity * currentPrice).toLocaleString()}</p>}
          </div>

          {item.pricingTiers?.length > 0 && (
            <div className="wholesale-pricing">
              <p className="wholesale-title">Wholesale pricing</p>
              <div className="wholesale-tiers-grid">
                {item.pricingTiers.map((tier, index) => {
                  const active = hasQuantity && previewQuantity >= Number(tier.minQuantity) &&
                    (tier.maxQuantity == null || previewQuantity <= Number(tier.maxQuantity));
                  const range = tier.maxQuantity == null
                    ? Number(tier.minQuantity) + "+ kg"
                    : Number(tier.minQuantity) + "–" + Number(tier.maxQuantity) + " kg";
                  return (
                    <div className={"tier-card " + (active ? "active-tier" : "")} key={index}>
                      <span className="tier-range">{range}</span>
                      <span className="tier-rate">₦{Number(tier.unitPrice).toLocaleString()}/kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="item-details-desc">{item.description}</p>
          {(item.subcategory || item.species || item.condition || item.productionMethod || item.weightRange || item.availability) && (
            <dl className="product-attributes">
              {item.subcategory && <div><dt>Product type</dt><dd>{item.subcategory}</dd></div>}
              {item.species && <div><dt>{item.category === "Food Crops" ? "Crop variety" : "Species"}</dt><dd>{item.species}</dd></div>}
              {item.condition && <div><dt>Condition</dt><dd>{item.condition}</dd></div>}
              {item.productionMethod && <div><dt>{item.category === "Food Crops" ? "Growing method" : "Production method"}</dt><dd>{item.productionMethod}</dd></div>}
              {item.weightRange && <div><dt>{item.category === "Food Crops" ? "Pack size" : "Size range"}</dt><dd>{item.weightRange}</dd></div>}
              {item.availability && <div><dt>Availability</dt><dd>{item.availability}</dd></div>}
            </dl>
          )}
          {isMarketplaceProduct && item.vendorId && <section className="product-vendor-panel" aria-labelledby="product-vendor-title"><h2 id="product-vendor-title">Listed by {item.vendorId.businessName || "Approved vendor"}</h2>{(item.vendorId.lga || item.vendorId.state || item.vendorId.location) && <p><strong>Location:</strong> {[item.vendorId.lga, item.vendorId.state].filter(Boolean).join(", ") || item.vendorId.location}{item.vendorId.location && (item.vendorId.state || item.vendorId.lga) ? ` · ${item.vendorId.location}` : ""}</p>}{item.vendorId.description && <p>{item.vendorId.description}</p>}<p className="vendor-verification-note">{item.vendorId.status === "approved" ? "Vendor application approved by Elevoni" : "Vendor status not available"}</p><p className="marketplace-disclaimer">Marketplace listings are enquiries, not confirmed orders. Confirm availability, final price, payment and delivery arrangements before paying.</p><a className="add-to-cart-btn primary-btn marketplace-detail-enquire" href={`https://wa.me/${ELEVONI_WHATSAPP_PHONE}?text=${encodeURIComponent(`Hello Elevoni Farms, I would like to enquire about ${item.name}. Please confirm availability, final price and delivery arrangements.`)}`} target="_blank" rel="noopener noreferrer">Enquire with Elevoni</a></section>}

          {!isMarketplaceProduct && <form className="item-quantity-form" onSubmit={saveQuantity}>
            <label htmlFor={`detail-quantity-${item._id}`}>Choose quantity <span>(kilograms)</span></label>
            <div className="item-quantity-controls">
              <div className="item-quantity-field">
                <input
                  id={`detail-quantity-${item._id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={draftQuantity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraftQuantity(value);
                    if (value === "") {
                      void updateCartQuantity(item._id, 0);
                      return;
                    }
                    const nextQuantity = Number(value);
                    if (Number.isSafeInteger(nextQuantity) && nextQuantity >= 0) {
                      void updateCartQuantity(item._id, nextQuantity);
                    }
                  }}
                  aria-label={`Quantity of ${item.name} in kilograms`}
                  required
                />
                <span>kg</span>
              </div>
              <button className="add-to-cart-btn primary-btn" type="submit" disabled={!isValidQuantity || previewQuantity === 0}>
                {quantity > 0 ? "Update cart" : "Add to cart"}
              </button>
            </div>
            {quantity > 0 && <p className="item-quantity-note">Currently in your cart: {quantity} kg</p>}
          </form>}
          {!isMarketplaceProduct && quantity > 0 && (
            <button className="go-to-cart-btn" type="button" onClick={() => navigate("/cart")}>Go to cart</button>
          )}

        </div>
      </div>
    </div>
  );
};

export default ItemDetails;