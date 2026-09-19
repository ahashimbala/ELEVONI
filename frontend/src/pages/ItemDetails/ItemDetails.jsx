import React, { useContext, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StoreContext } from "../../context/StoreContext";
import "./ItemDetails.css";
import getProductPrice from "../../utils/pricing";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fish_list, cartItems, addtoCart, removeFromCart, url } =
    useContext(StoreContext);

  const item = fish_list.find((fish) => fish._id === id);

  const [selected, setSelected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
  }, [selected]);

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

  const quantity = cartItems?.[item._id] || 0;
  const currentPrice = getProductPrice(item, quantity || 1);
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
        <title>{item.name} | Buy Fresh on Elevoni</title>
        <meta
          name="description"
          content={`Purchase premium, fresh ${item.name} directly from verified local farms on Elevoni. ₦${currentPrice.toLocaleString()} per kg.`}
        />
        <link
          rel="canonical"
          href={`https://elevonifarms.vercel.app/product/${item._id}`}
        />
        <meta
          property="og:title"
          content={`${item.name} - Elevoni Marketplace`}
        />
        <meta
          property="og:description"
          content={`Get fresh ${item.name} direct from the pond to your kitchen.`}
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

            {quantity > 0 && (
              <p className="selected-price">
                {quantity} kg × ₦{currentPrice.toLocaleString()} = ₦
                {(quantity * currentPrice).toLocaleString()}
              </p>
            )}
          </div>

          {item.name?.toLowerCase().includes("smoked catfish") && (
            <div className="wholesale-pricing">
              <p className="wholesale-title">Wholesale pricing</p>

              <div className="wholesale-tiers-grid">
                <div
                  className={`tier-card ${quantity >= 1 && quantity <= 4 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">1–4 kg</span>
                  <span className="tier-rate">₦25,000/kg</span>
                </div>

                <div
                  className={`tier-card ${quantity >= 5 && quantity <= 9 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">5–9 kg</span>
                  <span className="tier-rate">₦24,000/kg</span>
                </div>

                <div
                  className={`tier-card ${quantity >= 10 && quantity <= 19 ? "active-tier" : ""}`}
                >
                  <span className="tier-range">10–19 kg</span>
                  <span className="tier-rate">₦22,500/kg</span>
                </div>

                <div
                  className={`tier-card ${quantity >= 20 ? "active-tier" : ""}`}
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

          <div className="action-section">
            {!cartItems?.[item._id] ? (
              <button
                className="add-to-cart-btn primary-btn"
                onClick={() => addtoCart(item._id)}
              >
                Add to Cart
              </button>
            ) : (
              <div className="cart-management-flow">
                <div className="quantity-adjuster-block">
                  <button onClick={() => removeFromCart(item._id)}>-</button>
                  <span>{cartItems[item._id]}</span>
                  <button onClick={() => addtoCart(item._id)}>+</button>
                </div>

                <button
                  className="go-to-cart-checkout-btn"
                  onClick={() => navigate("/cart")}
                >
                  Go to Cart →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
