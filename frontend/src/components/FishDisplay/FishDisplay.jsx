import React, { useContext } from "react";
import "./FishDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FishItem from "../FishItem/FishItem";

const FishDisplay = ({ category }) => {
  const { fish_list } = useContext(StoreContext);

  return (
    <div className="fish-display" id="fish-display">
      <h2>Fresh picks near you</h2>
      <div className="fish-display-list">
        {fish_list.map((item) => {
          if (category === "All" || category === item.category) {
            return (
              <FishItem
                key={item._id}
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                image={item.image}
                category={item.category}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default FishDisplay;
