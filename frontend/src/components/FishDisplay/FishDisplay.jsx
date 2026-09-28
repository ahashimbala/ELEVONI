import { useContext } from "react";
import "./FishDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FishItem from "../FishItem/FishItem";

const FishDisplay = () => {
  const { fish_list } = useContext(StoreContext);

  // Get the primary product (Smoked Catfish) or default to the first available item
  const product =
    fish_list.find((item) =>
      item.name?.toLowerCase().includes("smoked catfish"),
    ) || fish_list[0];

  if (!product) {
    return null;
  }

  return (
    <section className="fish-display" id="fish-display">
      <div className="fish-display-header">
        <span className="featured-badge">Farm Fresh Harvest</span>
        <h2>Our Premium Smoked Catfish</h2>
        <p className="fish-display-subtitle">
          Sustainably raised, carefully oven-smoked, and packaged for
          long-lasting freshness and authentic flavor.
        </p>
      </div>

      <div className="single-product-container">
        <FishItem
          key={product._id}
          id={product._id}
          name={product.name}
          description={product.description}
          price={product.price}
          image={product.image}
        />
      </div>
    </section>
  );
};

export default FishDisplay;
