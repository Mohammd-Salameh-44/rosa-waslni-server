import { useEffect, useState } from "react";
import { usePageTransition } from "../App";
import { useLang } from "../LanguageContext";
import logo from "../assets/logo.png";

function Home() {
  const { goWithFlash } = usePageTransition();
  const { t, toggleLang } = useLang();

  const [mediaList, setMediaList] = useState([]);
  const [index, setIndex] = useState(0);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("homeMedia")) || [];
    setMediaList(saved);
  }, []);

  const next = () => {
    setIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const toggleDark = () => {
    setDark(!dark);
    document.body.classList.toggle("dark");
  };

  const items = [
    { name: t.sweets, path: "/sweets", icon: "🍬" },
    { name: t.chocolate, path: "/chocolate", icon: "🍫" },
    { name: t.flowers, path: "/flowers", icon: "🌸" },
    { name: t.others, path: "/others", icon: "🎁" },
    { name: t.contact, path: "/contact", icon: "📞" }
  ];

  return (
    <div className="home-split">

      {/* 🔥 TOP ICONS */}
      <div className="home-top-actions">
        <button className="dark-icon-btn" onClick={toggleDark}>
          {dark ? "☀️" : "🌙"}
        </button>

        <button className="lang-btn" onClick={toggleLang}>
          🌍
        </button>
      </div>

      <div className="home-split-bg"></div>

      <div className="home-content">
        <div className="home-left glass">
          <h1 className="home-tag">{t.title}</h1>

          <img className="home-logo" src={logo} alt="ROSA Logo" />

          <p className="home-text">{t.description}</p>

          <div className="home-actions">
            {items.map((item) => (
              <button key={item.path} onClick={() => goWithFlash(item.path)}>
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="home-right glass">

          {/* 👇 إذا في ميديا */}
          {mediaList.length > 0 ? (
            <>
              {mediaList[index].type === "video" ? (
                <video
                  src={mediaList[index].src}
                  autoPlay
                  muted
                  loop
                  className="home-media"
                />
              ) : (
                <img
                  src={mediaList[index].src}
                  alt="media"
                  className="home-media"
                />
              )}

              {/* 🔥 الأسهم */}
              <button className="arrow left" onClick={prev}>⬅</button>
              <button className="arrow right" onClick={next}>➡</button>
            </>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=900&q=80"
              alt="ROSA shop"
            />
          )}

          <div className="floating-badge">
            <a
              href="https://maps.app.goo.gl/H977ZCWZxLZYTeZ57"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.location}
            </a>
          </div>
        </div>
      </div>

      {/* 🔥 FOOTER */}
      <div className="footer glass">
        <p>© 2026 ROSA Coffee & Flowers</p>
        <button onClick={() => goWithFlash("/contact")}>
          {t.contact}
        </button>
      </div>

    </div>
  );
}

export default Home;