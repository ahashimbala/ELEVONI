import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CategoryGrid.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { listCategories } from "../../config/categories.js";
import { COUNT_STATUS, buildCategoryCards } from "../../utils/categoryViews.js";
import {
  fetchLivestockParentCount,
  fetchPublicProductCount,
} from "../../utils/marketplace.js";

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter((word) => /[a-z]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const CategoryCard = ({ card }) => {
  const mediaUrl = card.media?.key ? assets[card.media.key] : null;
  const [imageFailed, setImageFailed] = useState(false);
  const linkLabel = card.availability.orderable
    ? `Browse ${card.name}`
    : `View ${card.name}`;

  return (
    <article className="category-card">
      <Link className="category-card-media" to={card.path} aria-label={linkLabel}>
        {mediaUrl && !imageFailed ? (
          <img
            className="category-card-image"
            src={mediaUrl}
            alt={card.media.alt || ""}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="category-card-monogram" aria-hidden="true">
            {initialsOf(card.name)}
          </span>
        )}
      </Link>

      <div className="category-card-body">
        <p className="category-card-eyebrow">{card.eyebrow}</p>
        <h3 className="category-card-title">
          <Link to={card.path}>{card.name}</Link>
        </h3>
        <p className="category-card-summary">{card.summary}</p>

        {card.childNames.length > 0 && (
          <p className="category-card-children">{card.childNames.join(", ")}</p>
        )}

        <p className={`category-card-status status-${card.availability.tone}`}>
          {card.availability.label}
        </p>

        <Link className="category-card-link" to={card.path}>
          {linkLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </article>
  );
};

const CategoryGrid = () => {
  const { fish_list, url } = useContext(StoreContext);
  const catalogueCount = Array.isArray(fish_list) ? fish_list.length : 0;

  const [counts, setCounts] = useState({
    aquaculture: { count: null, status: COUNT_STATUS.LOADING },
    livestock: { count: null, status: COUNT_STATUS.LOADING },
    foodCrops: { count: null, status: COUNT_STATUS.LOADING },
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchCounts = async () => {
      setCounts({
        aquaculture: { count: null, status: COUNT_STATUS.LOADING },
        livestock: { count: null, status: COUNT_STATUS.LOADING },
        foodCrops: { count: null, status: COUNT_STATUS.LOADING },
      });

      const [livestock, aquaculture, foodCrops] = await Promise.allSettled([
        fetchLivestockParentCount({ url, signal: controller.signal }),
        fetchPublicProductCount({
          url,
          category: "Catfish & Aquaculture",
          signal: controller.signal,
        }),
        fetchPublicProductCount({
          url,
          category: "Food Crops",
          signal: controller.signal,
        }),
      ]);

      if (cancelled) return;

      const result = (settled) =>
        settled.status === "fulfilled"
          ? { count: settled.value, status: COUNT_STATUS.READY }
          : { count: null, status: COUNT_STATUS.ERROR };

      setCounts({
        aquaculture: result(aquaculture),
        livestock: result(livestock),
        foodCrops: result(foodCrops),
      });
    };

    fetchCounts();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  const countStatuses = Object.values(counts).map((entry) => entry.status);
  const marketplaceCountStatus = countStatuses.includes(COUNT_STATUS.LOADING)
    ? COUNT_STATUS.LOADING
    : countStatuses.includes(COUNT_STATUS.ERROR)
      ? COUNT_STATUS.ERROR
      : COUNT_STATUS.READY;

  const categories = listCategories();
  const cards = buildCategoryCards({
    categories,
    catalogueCount,
    marketplaceCounts: {
      aquaculture: counts.aquaculture.count ?? 0,
      livestock: counts.livestock.count ?? 0,
      "food-crops": counts.foodCrops.count ?? 0,
    },
    marketplaceCountStatus,
  });

  return (
    <section className="category-section" id="categories" aria-labelledby="category-section-title">
      <div className="category-section-heading">
        <p className="category-section-eyebrow">Shop by category</p>
        <h2 id="category-section-title">Start with what you need</h2>
        <p className="category-section-intro">
          Explore aquaculture and fishery, livestock, and food crops. See what
          approved vendors have listed, and what is available to order today.
        </p>
      </div>

      <nav className="category-grid" aria-label="Product categories">
        {cards.map((card) => (
          <CategoryCard key={card.slug} card={card} />
        ))}
      </nav>
    </section>
  );
};

export default CategoryGrid;
 