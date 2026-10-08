import { useContext } from "react";
import "./FishDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FishItem from "../FishItem/FishItem";

const FishDisplay = () => {
  const { fish_list } = useContext(StoreContext);

  return (
    <section className="fish-display" id="fish-display">
      <div className="fish-display-heading">
        <p className="fish-display-eyebrow">The Elevoni favourite</p>
        <h2>Smoked Catfish, ready for your table</h2>
        <p className="fish-display-intro">
          One carefully prepared product, with clear per-kilogram wholesale pricing.
        </p>
      </div>
      <div className="fish-display-list">
        {fish_list.map((item) => (
          <FishItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            pricingMode={item.pricingMode}
            pricingTiers={item.pricingTiers}
            image={item.image}
          />
        ))}
      </div>
    </section>
  );
};

export default FishDisplay;
