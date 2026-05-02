import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Admin() {
  const ADMIN_EMAIL = "rosecoffeeflower@gmail.com";
  const ADMIN_PASS = "Sala-055989";

  const CLOUD_NAME = "df141dibk";
  const UPLOAD_PRESET = "Rose_Flower";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [logged, setLogged] = useState(false);

  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [page, setPage] = useState("sweets");
  const [image, setImage] = useState("");

  const [homeMedia, setHomeMedia] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rosaProducts")) || [];
    setProducts(saved);

    const savedMedia = JSON.parse(localStorage.getItem("homeMedia")) || [];
    setHomeMedia(savedMedia);
  }, []);

  const login = () => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      setLogged(true);
    } else {
      alert("Wrong email or password");
    }
  };

  const saveProducts = (updated) => {
    setProducts(updated);
    localStorage.setItem("rosaProducts", JSON.stringify(updated));
  };

  const saveHomeMedia = (updated) => {
    setHomeMedia(updated);
    localStorage.setItem("homeMedia", JSON.stringify(updated));
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: data
      }
    );

    const result = await res.json();

    if (!result.secure_url) {
      alert("Upload failed");
      throw new Error("Cloudinary upload failed");
    }

    return result.secure_url;
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
  };

  const handleHomeMedia = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadedMedia = [];

      for (const file of files) {
        const url = await uploadToCloudinary(file);

        uploadedMedia.push({
          id: Date.now().toString() + Math.random().toString(),
          type: file.type.startsWith("video") ? "video" : "image",
          src: url
        });
      }

      const updated = [...homeMedia, ...uploadedMedia];
      saveHomeMedia(updated);
      e.target.value = "";
    } catch (error) {
      console.error(error);
      alert("Failed to upload home media");
    }
  };

  const deleteHomeMedia = (id) => {
    const updated = homeMedia.filter((m) => m.id !== id);
    saveHomeMedia(updated);
  };

  const clearForm = () => {
    setName("");
    setDesc("");
    setPage("sweets");
    setImage("");
    setEditId(null);
  };

  const saveProduct = async () => {
    if (!name || !desc || !image) {
      alert("Fill all fields");
      return;
    }

    try {
      let imageUrl = image;

      if (image instanceof File) {
        imageUrl = await uploadToCloudinary(image);
      }

      if (editId) {
        const updated = products.map((p) =>
          p.id === editId ? { ...p, name, desc, page, image: imageUrl } : p
        );

        saveProducts(updated);
        clearForm();
        return;
      }

      const newProduct = {
        id: Date.now().toString(),
        name,
        desc,
        image: imageUrl,
        page,
        hidden: false
      };

      saveProducts([...products, newProduct]);
      clearForm();
    } catch (error) {
      console.error(error);
      alert("Failed to save product");
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setName(p.name);
    setDesc(p.desc);
    setPage(p.page);
    setImage(p.image);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
  };

  const toggleHide = (id) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, hidden: !p.hidden } : p
    );
    saveProducts(updated);
  };

  if (!logged) {
    return (
      <div className="container">
        <div className="glass admin-box">
          <h2>Admin Login</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          <button onClick={login}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />

      <h2 className="page-title">Admin Dashboard</h2>

      <div className="glass admin-box">
        <h3>Home Page Images / Videos</h3>

        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleHomeMedia}
        />

        <div className="admin-products">
          {homeMedia.map((m) => (
            <div key={m.id} className="glass admin-product-card">
              {m.type === "video" ? (
                <video src={m.src} controls className="admin-preview" />
              ) : (
                <img src={m.src} alt="" />
              )}

              <p>{m.type}</p>

              <button onClick={() => deleteHomeMedia(m.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass admin-box">
        <h3>{editId ? "Edit Product" : "Add Product"}</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <select value={page} onChange={(e) => setPage(e.target.value)}>
          <option value="sweets">Sweets</option>
          <option value="chocolate">Chocolate</option>
          <option value="nuts">Nuts</option>
          <option value="flowers">Flowers</option>
          <option value="others">Others</option>
        </select>

        <input type="file" accept="image/*" onChange={handleImage} />

        {image && (
          <img
            className="admin-preview"
            src={image instanceof File ? URL.createObjectURL(image) : image}
            alt=""
          />
        )}

        <button onClick={saveProduct}>
          {editId ? "Save Changes" : "Add Product"}
        </button>

        {editId && <button onClick={clearForm}>Cancel</button>}
      </div>

      <h3 className="page-title">Products</h3>

      <div className="admin-products">
        {products.map((p) => (
          <div key={p.id} className="glass admin-product-card">
            <img src={p.image} alt="" />

            <h4>{p.name}</h4>
            <p>{p.page}</p>

            <button onClick={() => startEdit(p)}>Edit</button>

            <button onClick={() => toggleHide(p.id)}>
              {p.hidden ? "Show" : "Hide"}
            </button>

            <button onClick={() => deleteProduct(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}