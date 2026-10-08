import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PricingTiersFields from "../../components/PricingTiersFields";
import "./AddProduct.css";

const emptyProduct = () => ({ name: "", description: "", price: "", category: "Smoked", pricingMode: "single", pricingTiers: [] });

const hasTierRows = (tiers) => (tiers || []).some((tier) => String(tier?.minQuantity ?? "").trim() !== "");

const AddProduct = ({ url }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(emptyProduct);
  const [image, setImage] = useState(null);
  const onChange = (event) => setData({ ...data, [event.target.name]: event.target.value });

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", data.price);
      formData.append("category", data.category);
      formData.append("pricingTiers", JSON.stringify(data.pricingTiers));
      formData.append("pricingMode", hasTierRows(data.pricingTiers) ? "tiered" : "single");
      if (image) formData.append("image", image);

      const response = await api.post(url + "/api/fish/add", formData);
      if (!response.data.success) throw new Error(response.data.message || "Product could not be created");
      toast.success("Product created successfully");
      setData(emptyProduct());
      setImage(null);
      navigate("/add-media/" + response.data.id);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to create product");
    }
  };

  return (
    <form onSubmit={onSubmit} className="add-form">
      <h2>Add Product</h2>
      <input name="name" value={data.name} placeholder="Name" onChange={onChange} required />
      <textarea name="description" value={data.description} placeholder="Description" onChange={onChange} required />
      <input name="price" type="number" min="1" step="1" value={data.price} placeholder="Base price (NGN)" onChange={onChange} required />
      <select name="category" value={data.category} onChange={onChange}>
        <option value="Smoked">Smoked</option>
        <option value="Fresh">Fresh</option>
      </select>
      <PricingTiersFields tiers={data.pricingTiers} onChange={(pricingTiers) => setData({ ...data, pricingTiers })} />
      <label>
        Main product image
        <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} required />
      </label>
      <button type="submit">Create Product</button>
    </form>
  );
};

export default AddProduct;
