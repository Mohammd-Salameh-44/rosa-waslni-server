import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageTransition } from "../App";
import { useLang } from "../LanguageContext";
import logo from "../assets/logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const { goWithFlash } = usePageTransition();
  const { toggleLang, t } = useLang();

  const go = (path) => {
    setOpen(false);
    goWithFlash(path);
  };

  const toggleDark = () => {
    setDark(!dark);
    document.body.classList.toggle("dark");
  };

  return (
    <div className="navbar glass">

      {/* 🔹 LOGO (LEFT) */}
      <div className="logo-left" onClick={() => goWithFlash("/")}>
        <img src={logo} alt="ROSA Logo" className="navbar-logo" />
      </div>

      {/* 🔹 DESKTOP NAV (RIGHT) */}
      <div className="desktop-nav">
        <button onClick={() => go("/")}>{t.home}</button>
        <button onClick={() => go("/sweets")}>{t.sweets}</button>
        <button onClick={() => go("/chocolate")}>{t.chocolate}</button>
        <button onClick={() => go("/flowers")}>{t.flowers}</button>
        <button onClick={() => go("/others")}>{t.others}</button>
        <button onClick={() => go("/contact")}>{t.contact}</button>

        {/* 🌙 DARK MODE ICON */}
        <button className="dark-icon-btn" onClick={toggleDark}>
          {dark ? "☀️" : "🌙"}
        </button>

        {/* 🌐 LANGUAGE ICON */}
        <button className="lang-btn" onClick={toggleLang}>
          🌐
        </button>
      </div>

      {/* 🔹 MOBILE MENU BUTTON */}
      <button className="hamburger-btn" onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* 🔹 MOBILE MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu glass"
            initial={{ scale: 0.4, opacity: 0, x: 40, y: -30 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0.4, opacity: 0, x: 40, y: -30 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <button onClick={() => go("/")}>{t.home}</button>
            <button onClick={() => go("/sweets")}>{t.sweets}</button>
            <button onClick={() => go("/chocolate")}>{t.chocolate}</button>
            <button onClick={() => go("/flowers")}>{t.flowers}</button>
            <button onClick={() => go("/others")}>{t.others}</button>
            <button onClick={() => go("/contact")}>{t.contact}</button>

            {/* 🌙 */}
            <button className="dark-icon-btn" onClick={toggleDark}>
              {dark ? "☀️" : "🌙"}
            </button>

            {/* 🌐 */}
            <button className="lang-btn" onClick={toggleLang}>
              🌐
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}