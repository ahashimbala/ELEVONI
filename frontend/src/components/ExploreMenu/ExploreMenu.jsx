import React from "react";
import "./ExploreMenu.css";
import { shop_list } from "../../assets/assets";

const ExploreMenu = () => {
  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Shop Smoked Catfish</h1>

      <p className="explore-menu-text">
        From our farm to your table, Elevoni delivers quality smoked catfish you
        can trust. Carefully prepared, richly smoked, and conveniently
        delivered—quality fish has never been this easy to get.
      </p>

      <div className="explore-menu-list">
        {shop_list.map((item, index) => (
          <div key={index} className="explore-menu-list-item">
            <img src={item.product_image} alt={item.product_name} />

            <p>{item.product_name}</p>
          </div>
        ))}
      </div>

      <hr />
    </div>
  );
};

export default ExploreMenu;
