import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import { useLang } from "./LanguageContext";

import Home from "./pages/Home";
import Sweets from "./pages/Sweets";
import Chocolate from "./pages/Chocolate";
import Nuts from "./pages/Nuts";
import Flowers from "./pages/Flowers";
import Others from "./pages/Others";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";

import "./styles/main.css";

/* ================= CONTEXT ================= */
const TransitionContext = createContext();

export function usePageTransition() {
  return useContext(TransitionContext);
}

/* ================= APP CONTENT ================= */
function AppContent() {
  const navigate = useNavigate();
  const [showFlash, setShowFlash] = useState(false);

  const { lang } = useLang();

  /* 🌍 RTL / LTR */
  useEffect(() => {
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  /* 🌟 Transition */
  const goWithFlash = (path) => {
    setShowFlash(true);

    setTimeout(() => {
      navigate(path);
    }, 400);

    setTimeout(() => {
      setShowFlash(false);
    }, 800);
  };

  return (
    <TransitionContext.Provider value={{ goWithFlash }}>

      {/* 🔥 Blur Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(28px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(255, 240, 250, 0.7)",
              zIndex: 9999
            }}
          />
        )}
      </AnimatePresence>

      {/* 📄 Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sweets" element={<Sweets />} />
        <Route path="/chocolate" element={<Chocolate />} />
        <Route path="/nuts" element={<Nuts />} />
        <Route path="/flowers" element={<Flowers />} />
        <Route path="/others" element={<Others />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

    </TransitionContext.Provider>
  );
}

/* ================= ROOT ================= */
export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}