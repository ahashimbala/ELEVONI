import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddProduct.css";

const AddProduct = ({ url }) => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Fresh",
  });

  const [image, setImage] = useState(null);

  const onChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", data.price);
      formData.append("category", data.category);
      formData.append("image", image);

      const res = await axios.post(`${url}/api/fish/add`, formData);

      if (res.data.success) {
        toast.success("Product created successfully");

        setData({
          name: "",
          description: "",
          price: "",
          category: "Fresh",
        });

        setImage(null);

        setTimeout(() => {
          navigate(`/add-media/${res.data.id}`);
        }, 1500);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  return (
    <form onSubmit={onSubmit} className="add-form">
      <input
        name="name"
        value={data.name}
        placeholder="Name"
        onChange={onChange}
        required
      />

      <textarea
        name="description"
        value={data.description}
        placeholder="Description"
        onChange={onChange}
        required
      />

      <input
        name="price"
        value={data.price}
        placeholder="Price"
        onChange={onChange}
        required
      />

      <select name="category" value={data.category} onChange={onChange}>
        <option value="Fresh">Fresh</option>
        <option value="Smoked">Smoked</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        required
      />

      <button type="submit">Create Product</button>
    </form>
  );
};

export default AddProduct;
