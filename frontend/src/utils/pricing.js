const getProductPrice = (product, quantity) => {
    const productName = product && product.name ? product.name.toLowerCase() : "";

    const isSmokedCatfish = productName.includes("smoked catfish");

    if (!isSmokedCatfish) {
        return product.price;
    }

    if (quantity >= 20) {
        return 21000;
    }

    if (quantity >= 10) {
        return 22500;
    }

    if (quantity >= 5) {
        return 24000;
    }

    return 25000;
};

export default getProductPrice;