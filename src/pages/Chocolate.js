import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useLang } from "../LanguageContext";
import { usePageTransition } from "../App";

export default function Chocolate() {
  const [selected, setSelected] = useState(null);
  const [products, setProducts] = useState([]);
  const { t, toggleLang } = useLang();
  const { goWithFlash } = usePageTransition();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("rosaProducts")) || [];
    setProducts(saved.filter((p) => p.page === "chocolate" && !p.hidden));
  }, []);

  return (
    <div className="container">
      <Navbar />

      <h2 className="page-title">{t.chocolate}</h2>

      {products.length === 0 ? (
        <div className="empty-card glass">
          <div className="empty-icon">🍫</div>
          <h3>{t.noProductsTitle}</h3>
          <p>{t.noProductsDesc}</p>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <motion.div
              key={p.id}
              layoutId={`card-${p.id}`}
              className="glass card"
              onClick={() => setSelected(p)}
            >
              <motion.img layoutId={`img-${p.id}`} src={p.image} alt={p.name} />
              <motion.h3 layoutId={`title-${p.id}`}>{p.name}</motion.h3>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            className="backdrop"
            onClick={() => setSelected(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              layoutId={`card-${selected.id}`}
              className="glass modal"
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <motion.img
                layoutId={`img-${selected.id}`}
                src={selected.image}
                alt={selected.name}
              />

              <motion.h2 layoutId={`title-${selected.id}`}>
                {selected.name}
              </motion.h2>

              <p>{selected.desc}</p>

              <button onClick={() => setSelected(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="footer glass">
        <p>© 2026 ROSA Coffee & Flowers</p>
        <button onClick={() => goWithFlash("/contact")}>
          {t.contact}
        </button>
      </div>
    </div>
  );
}