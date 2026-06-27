import React, { useContext, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./ItemDetails.css";

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

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="item-details">
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
                {!isPlaying && (
                  <div className="video-overlay-play" onClick={handlePlayVideo}>
                    <span>Click to Play Video</span>
                  </div>
                )}
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

          <p className="item-details-price">
            ₦{item.price.toLocaleString()}
            <span className="price-unit"> per kg</span>
          </p>

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
