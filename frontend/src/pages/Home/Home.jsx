import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
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
      <Helmet>
        <title>
          Elevoni Farms | Fresh Fish Marketplace Direct From Local Ponds
        </title>
        <meta
          name="description"
          content="Buy premium fresh catfish, tilapia, and aquaculture products directly from verified local farms. Fast delivery and secure payments on Elevoni."
        />
        <link rel="canonical" href="https://elevonifarms.vercel.app/" />
        <meta
          property="og:title"
          content="Elevoni Farms - Farm-Fresh Aquaculture Marketplace"
        />
        <meta
          property="og:description"
          content="Connect directly with local fish farmers. Shop fresh, high-quality aquaculture products online."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://elevonifarms.vercel.app/" />
      </Helmet>

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
