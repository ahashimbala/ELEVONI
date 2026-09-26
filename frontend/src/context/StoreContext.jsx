import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "https://elevoni-backend.vercel.app";
  const [token, setToken] = useState("");
  const [fish_list, setFishList] = useState([]);

  const addtoCart = async (itemId) => {
    if (!cartItems) {
      setCartItems({});
    }

    if (!cartItems?.[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }

    if (token) {
      try {
        await axios.post(
          url + "/api/cart/add",
          { itemId },
          { headers: { token } },
        );
      } catch (error) {
        console.error(
          "Failed to sync added item to remote cart:",
          error.message,
        );
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      try {
        await axios.post(
          url + "/api/cart/remove",
          { itemId },
          { headers: { token } },
        );
      } catch (error) {
        console.error(
          "Failed to sync removed item from remote cart:",
          error.message,
        );
      }
    }
  };

  const getProductPrice = (itemInfo, quantity) => {
    const isSmokedCatfish = itemInfo.name
      ?.toLowerCase()
      .includes("smoked catfish");

    if (!isSmokedCatfish) {
      return itemInfo.price;
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

  const getTotalCartAmount = () => {
    let totalAmount = 0;

    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = fish_list.find((product) => product._id === item);

        if (itemInfo) {
          const quantity = cartItems[item];
          const price = getProductPrice(itemInfo, quantity);

          totalAmount += price * quantity;
        }
      }
    }

    return totalAmount;
  };

  const fetchFishList = async () => {
    try {
      const response = await axios.get(url + "/api/fish/list");
      setFishList(response.data.data);
    } catch (error) {
      console.error("Failed to fetch product library listings:", error.message);
    }
  };

  const loadCartData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token } },
      );
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.error("Failed to retrieve user cart record:", error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
    }
    async function loadData() {
      await fetchFishList();
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        await loadCartData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, []);

  const contextValue = {
    fish_list,
    cartItems,
    setCartItems,
    addtoCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
