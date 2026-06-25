import React, { useState } from "react";
import "./Home.css";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FishDisplay from "../../components/FishDisplay/FishDisplay";
import AppDownload from "../../components/AppDownload/AppDownload";
import Features from "../../components/Features/Features";
import Reviews from "../../components/Reviews/Reviews";

const Home = () => {
  const [category, setCategory] = useState("All");

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FishDisplay category={category} />
      <Features />
      <Reviews />
      <AppDownload />
    </div>
  );
};

export default Home;
