import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddMedia.css";

const AddMedia = ({ url }) => {
  const { id } = useParams();

  const [media, setMedia] = useState([]);

  const submitMedia = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("id", id);

      for (let i = 0; i < media.length; i++) {
        formData.append("media", media[i]);
      }

      const res = await axios.post(`${url}/api/fish/add-media`, formData);

      if (res.data.success) {
        toast.success("Media uploaded successfully");
        setMedia([]);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to upload media");
    }
  };

  return (
    <form onSubmit={submitMedia} className="media-form">
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => setMedia(e.target.files)}
      />

      <button type="submit">Upload Media</button>
    </form>
  );
};

export default AddMedia;
