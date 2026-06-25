import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./List.css";

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/fish/list`);

      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error loading products");
      }
    } catch (error) {
      toast.error("Error loading products");
    }
  };

  const removeFish = async (fishId) => {
    try {
      const response = await axios.post(`${url}/api/fish/remove`, {
        id: fishId,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchList();
      } else {
        toast.error("Error deleting item");
      }
    } catch (error) {
      toast.error("Error deleting item");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list add flex-col">
      <p>All Products List</p>

      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Actions</b>
        </div>

        {list.map((item) => (
          <div key={item._id} className="list-table-format">
            <img
              src={
                item.image && item.image.startsWith("http")
                  ? item.image
                  : `${url}/images/${item.image}`
              }
              alt={item.name}
            />

            <p>{item.name}</p>

            <p>{item.category}</p>

            <p>₦{Number(item.price).toLocaleString()}</p>

            <div className="actions">
              <button
                className="media-btn"
                onClick={() => navigate(`/add-media/${item._id}`)}
              >
                Add Media
              </button>

              <button
                className="delete-btn"
                onClick={() => removeFish(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
