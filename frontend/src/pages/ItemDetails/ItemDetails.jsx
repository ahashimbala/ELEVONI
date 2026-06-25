import React, { useContext, useState } from "react";
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
      src: `${url}/images/${item.image}`,
    },

    ...(item.media?.map((file) => ({
      type: file.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image",
      src: `${url}/images/${file}`,
    })) || []),
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

  return (
    <div className="item-details">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="item-details-container">
        <div className="item-details-left">
          <div className="main-media">
            {gallery[safeIndex].type === "video" ? (
              <video
                key={gallery[safeIndex].src}
                src={gallery[safeIndex].src}
                controls
                preload="metadata"
              />
            ) : (
              <img src={gallery[safeIndex].src} alt="" />
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

          <p className="item-details-price">₦{item.price.toLocaleString()}</p>

          <p className="item-details-desc">{item.description}</p>

          {!cartItems?.[item._id] ? (
            <button
              className="add-to-cart-btn"
              onClick={() => addtoCart(item._id)}
            >
              Add to Cart
            </button>
          ) : (
            <div className="item-buttons">
              <button
                className="buy-now-btn"
                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>

              <p>{cartItems[item._id]}</p>

              <button
                className="add-to-cart-btn"
                onClick={() => addtoCart(item._id)}
              >
                Add More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
