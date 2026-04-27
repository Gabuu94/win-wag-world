import { useEffect, useState } from "react";
import logo from "@/assets/betking-logo.jpeg";

const SPLASH_KEY = "betking_splash_shown";

const SplashScreen = () => {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const hideTimer = setTimeout(() => setShow(false), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Glowing radial backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.25),_transparent_60%)] animate-pulse" />

      <div className="relative flex flex-col items-center gap-6 animate-[splashIn_900ms_cubic-bezier(0.22,1,0.36,1)]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-yellow-500/30 blur-3xl animate-pulse" />
          <img
            src={logo}
            alt="BetKing"
            className="relative w-64 sm:w-80 max-w-[80vw] drop-shadow-[0_0_30px_rgba(234,179,8,0.55)] animate-[logoFloat_2.5s_ease-in-out_infinite]"
          />
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" />
        </div>
      </div>

      <style>{`
        @keyframes splashIn {
          0% { opacity: 0; transform: scale(0.7); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
