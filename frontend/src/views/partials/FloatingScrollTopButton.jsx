import { useEffect, useState } from "react";
import "./FloatingScrollTopButton.css";

export default function FloatingScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className={`floating-scroll-btn ${isVisible ? "fade-in" : "fade-out"}`}>
      <button
        className="scroll-top-button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );
}
