import React, { useContext, useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StoreContext } from "../../context/StoreContext";
import "./ItemDetails.css";
import getProductPrice from "../../utils/pricing";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fish_list, cartItems, setCartQuantity, updateCartQuantity, url } =
    useContext(StoreContext);

  const item = fish_list.find((fish) => fish._id === id);

  const [selected, setSelected] = useState(0);
  const [draftQuantity, setDraftQuantity] = useState("1");
  const quantity = Number(item ? cartItems?.[item._id] || 0 : 0);
  const previousQuantity = useRef(quantity);
  const parsedQuantity = Number(draftQuantity);
  const isValidQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0;
  const previewQuantity = isValidQuantity ? parsedQuantity : 1;
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
  }, [selected]);

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      setDraftQuantity(quantity > 0 ? String(quantity) : "");
      previousQuantity.current = quantity;
    }
  }, [quantity]);

  if (!item) {
    return (
      <div className="item-not-found">
        <h2>Loading...</h2>
        <button className="back-btn" onClick={() => navigate("/")}>
          Go Back Home
        </button>
      </div>
    );
  }

  const currentPrice = getProductPrice(item, previewQuantity);
  const gallery = [
    {
      type: "image",
      src:
        item.image && item.image.startsWith("http")
          ? item.image
          : `${url}/images/${item.image}`,
    },
    ...(item.media?.map((file) => {
      const isVideo = file.match(/\.(mp4|webm|ogg)$/i);
      let srcPath =
        file && file.startsWith("http") ? file : `${url}/images/${file}`;

      if (isVideo) {
        srcPath = `${srcPath}#t=0.001`;
      }

      return {
        type: isVideo ? "video" : "image",
        src: srcPath,
      };
    }) || []),
  ];

  if (!gallery.length) {
    return (
      <div className="item-not-found">
        <h2>No media available</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const safeIndex = Math.min(selected, gallery.length - 1);

  const saveQuantity = async (event) => {
    event.preventDefault();
    if (!isValidQuantity) return;
    const saved = await setCartQuantity(item._id, parsedQuantity);
    if (!saved) {
      toast.error(saved === "forbidden"
        ? "This account is not authorized to use the cart. Please sign in again or contact support."
        : "Your quantity changed locally but could not be synced to your account.");
      return;
    }
    navigate("/cart");
  };

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: item.name,
    image: gallery[0]?.src,
    description: item.description,
    category: item.category,
    offers: {
      "@type": "Offer",
      url: window.location.href,
      priceCurrency: "NGN",
      price: currentPrice,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="item-details">
      <Helmet>
        <title>{item.name} | Smoked Catfish from Elevoni</title>
        <meta
          name="description"
          content={`Purchase ${item.name}, carefully prepared and smoked by Elevoni Farms. ₦${currentPrice.toLocaleString()} per kg.`}
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
          content={`Shop ${item.name} from Elevoni Farms. Carefully prepared and richly smoked for your table.`}
        />
        <meta property="og:image" content={gallery[0]?.src} />
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
          <div className="main-media">
            {gallery[safeIndex].type === "video" ? (
              <div className="main-video-wrapper">
                <video
                  ref={videoRef}
                  key={gallery[safeIndex].src}
                  src={gallery[safeIndex].src}
                  controls
                  playsInline
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              <img src={gallery[safeIndex].src} alt={item.name} />
            )}
          </div>

          <div className="thumbnail-row">
            {gallery.map((media, index) => (
              <div
                key={index}
                className={`thumb ${safeIndex === index ? "active" : ""}`}
                onClick={() => setSelected(index)}
              >
                {media.type === "video" ? (
                  <div className="video-thumb-container">
                    <video
                      src={media.src}
                      muted
                      playsInline
                      preload="metadata"
                      className="video-thumbnail"
                    />
                    <div className="play-icon">▶</div>
                  </div>
                ) : (
                  <img src={media.src} alt="" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="item-details-right">
          <h1>{item.name}</h1>

          <p className="item-details-category">
            Category: <span>{item.category}</span>
          </p>

          <div className="price-header-block">
            <p className="item-details-price">
              ₦{currentPrice.toLocaleString()}
              <span className="price-unit"> per kg</span>
            </p>

            {isValidQuantity && (
              <p className="selected-price">
                {previewQuantity} kg × ₦{currentPrice.toLocaleString()} = ₦
                {(previewQuantity * currentPrice).toLocaleString()}
              </p>
            )}
          </div>

          {item.name?.toLowerCase().includes("smoked catfish") && (
            <div className="wholesale-pricing">
              <p className="wholesale-title">Wholesale pricing</p>

              <div className="wholesale-tiers-grid">
                <div
                  className={`tier-card ${previewQuantity <= 4 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">1–4 kg</span>
                  <span className="tier-rate">₦25,000/kg</span>
                </div>

                <div
                  className={`tier-card ${previewQuantity >= 5 && previewQuantity <= 9 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">5–9 kg</span>
                  <span className="tier-rate">₦24,000/kg</span>
                </div>

                <div
                  className={`tier-card ${previewQuantity >= 10 && previewQuantity <= 19 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">10–19 kg</span>
                  <span className="tier-rate">₦22,500/kg</span>
                </div>

                <div
                  className={`tier-card ${previewQuantity >= 20 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">20+ kg</span>
                  <span className="tier-rate">₦21,000/kg</span>
                </div>
              </div>

              <p className="fish-size-note">
                Standard size: 5 pieces per kg. Larger sizes available on
                request.
              </p>
            </div>
          )}

          <p className="item-details-desc">{item.description}</p>

          <form className="item-quantity-form" onSubmit={saveQuantity}>
            <label htmlFor={`detail-quantity-${item._id}`}>Choose quantity <span>(kilograms)</span></label>
            <div className="item-quantity-controls">
              <div className="item-quantity-field">
                <input
                  id={`detail-quantity-${item._id}`}
                  type="number"
                  min="1"
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
                    if (Number.isSafeInteger(nextQuantity) && nextQuantity > 0) {
                      void updateCartQuantity(item._id, nextQuantity);
                    }
                  }}
                  aria-label={`Quantity of ${item.name} in kilograms`}
                  required
                />
                <span>kg</span>
              </div>
              <button className="add-to-cart-btn primary-btn" type="submit" disabled={!isValidQuantity}>
                {quantity > 0 ? "Update cart" : "Add to cart"}
              </button>
            </div>
            {quantity > 0 && <p className="item-quantity-note">Currently in your cart: {quantity} kg</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;