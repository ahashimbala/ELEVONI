import { useContext, useEffect, useRef, useState } from "react";
import "./FishItem.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import getProductPrice from "../../utils/pricing";

const FishItem = ({ id, name, image, price, description }) => {
  const { cartItems, setCartQuantity, updateCartQuantity, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const quantity = Number(cartItems?.[id] || 0);
  const [draftQuantity, setDraftQuantity] = useState(String(quantity || 1));
  const previousQuantity = useRef(quantity);
  const parsedQuantity = Number(draftQuantity);
  const isValidQuantity =
    Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0;
  const previewQuantity = isValidQuantity ? parsedQuantity : 1;
  const currentPrice = getProductPrice({ name, price }, previewQuantity);
  const isSmokedCatfish = name?.toLowerCase().includes("smoked catfish");

  useEffect(() => {
    if (previousQuantity.current !== quantity) {
      setDraftQuantity(quantity > 0 ? String(quantity) : "");
      previousQuantity.current = quantity;
    }
  }, [quantity]);

  const saveQuantity = async (event) => {
    event.preventDefault();
    if (!isValidQuantity) return;
    const saved = await setCartQuantity(id, parsedQuantity);
    if (!saved) {
      toast.error(
        saved === "forbidden"
          ? "This account does not have customer access. Please log in with a customer account to use the cart."
          : "Your quantity changed locally but could not be synced to your account.",
      );
      return;
    }
    navigate("/cart");
  };

  const imageUrl =
    image && image.startsWith("http") ? image : `${url}/images/${image}`;

  return (
    <article className="fish-item">
      <div className="fish-item-media">
        <img
          className="fish-item-image"
          src={imageUrl}
          alt={`${name} - Premium smoked catfish from Elevoni Farms`}
          loading="lazy"
          onClick={() => navigate(`/product/${id}`)}
        />
        <span className="fish-item-image-label">Carefully smoked</span>
      </div>

      <div className="fish-item-info">
        <div className="fish-item-copy">
          <p className="fish-item-kicker">Elevoni Farms · Smoked Catfish</p>
          <h3 className="fish-item-name">{name}</h3>
          <p className="fish-item-desc">{description}</p>
        </div>

        <div className="fish-item-price-block">
          <span className="fish-item-price-label">
            Your price at {previewQuantity} kg
          </span>
          <p className="fish-item-price">
            ₦{currentPrice.toLocaleString()}
            <span> / kg</span>
          </p>
          {isValidQuantity && (
            <p className="fish-item-estimate">
              Estimated product total: ₦
              {(currentPrice * previewQuantity).toLocaleString()}
            </p>
          )}
        </div>

        {isSmokedCatfish && (
          <div className="wholesale-pricing">
            <p className="wholesale-title">Wholesale price per kg</p>
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
              Standard size: 5 pieces per kg. Larger sizes are available on
              request.
            </p>
          </div>
        )}

        <form className="fish-item-cart-form" onSubmit={saveQuantity}>
          <label htmlFor={`quantity-${id}`}>
            Choose quantity <span>(kilograms)</span>
          </label>
          <div className="fish-item-cart-controls">
            <div className="fish-item-quantity-input">
              <input
                id={`quantity-${id}`}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={draftQuantity}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraftQuantity(value);
                  if (value === "") {
                    void updateCartQuantity(id, 0);
                    return;
                  }
                  const nextQuantity = Number(value);
                  if (Number.isSafeInteger(nextQuantity) && nextQuantity > 0) {
                    void updateCartQuantity(id, nextQuantity);
                  }
                }}
                aria-label={`Quantity of ${name} in kilograms`}
                required
              />
              <span>kg</span>
            </div>
            <button
              className="fish-item-add-button"
              type="submit"
              disabled={!isValidQuantity}
            >
              {quantity > 0 ? "Go to cart" : "Add to cart"}
            </button>
          </div>
          {quantity > 0 && (
            <p className="fish-item-cart-note">
              Currently in your cart: {quantity} kg
            </p>
          )}
        </form>

        <button
          className="details-btn"
          type="button"
          onClick={() => navigate(`/product/${id}`)}
        >
          View product details
        </button>
      </div>
    </article>
  );
};

export default FishItem;
