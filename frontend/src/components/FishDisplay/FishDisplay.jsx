import { useContext } from "react";
import "./FishDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FishItem from "../FishItem/FishItem";

const FishDisplay = () => {
  const { fish_list } = useContext(StoreContext);
  const smokedCatfish = fish_list.filter((item) =>
    item.name?.toLowerCase().includes("smoked catfish"),
  );

  return (
    <div className="fish-display" id="fish-display">
      <h2>Our Smoked Catfish</h2>
      <div className="fish-display-list">
        {smokedCatfish.map((item) => (
          <FishItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </div>
  );
};

export default FishDisplay;
