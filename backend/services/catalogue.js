const CATALOGUE_QUERY = Object.freeze({ visible: { $ne: false } });

const isCatalogueVisible = (product) => Boolean(product) && product?.visible !== false;

export { CATALOGUE_QUERY, isCatalogueVisible };