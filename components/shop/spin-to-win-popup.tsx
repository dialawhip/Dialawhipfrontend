"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const HIDE_UNTIL_KEY = "dw_spin_popup_hide_until";
const HIDE_FOR_MS = 24 * 60 * 60 * 1000;

const PRIZES = [
  "10% Off",
  "Free Shipping",
  "10% Off",
  "Free Shipping",
  "10% Off",
  "Free Shipping",
] as const;

const RIM_LIGHTS = Array.from({ length: 12 });
const CONFETTI = Array.from({ length: 22 });
const CONFETTI_COLORS = ["#f5eb12", "#004fb0", "#FFFFFF", "#003A85", "#FFF58A"];

function getHideUntil() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(HIDE_UNTIL_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

function setHideUntil(timestamp: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HIDE_UNTIL_KEY, String(timestamp));
}

export function SpinToWinPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const segment = useMemo(() => 360 / PRIZES.length, []);

  useEffect(() => {
    const hideUntil = getHideUntil();
    if (hideUntil > Date.now()) return;
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setHideUntil(Date.now() + HIDE_FOR_MS);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closePopup() {
    setOpen(false);
    setHideUntil(Date.now() + HIDE_FOR_MS);
  }

  function onSpin() {
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (spinning || result) return;

    const winnerIndex = Math.floor(Math.random() * PRIZES.length);
    const target = 360 - (winnerIndex * segment + segment / 2);
    const travel = 360 * 6 + target;

    setSpinning(true);
    setAngle((prev) => prev + travel);

    window.setTimeout(() => {
      setSpinning(false);
      setResult(PRIZES[winnerIndex]);
      setHideUntil(Date.now() + HIDE_FOR_MS);
    }, 4200);
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes dw-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dw-pop-in {
          0% { opacity: 0; transform: scale(0.82) translateY(14px) }
          60% { transform: scale(1.02) translateY(-2px) }
          100% { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes dw-pointer-bob {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg) }
          50% { transform: translateX(-50%) translateY(2px) rotate(2deg) }
        }
        @keyframes dw-rim-twinkle {
          0%, 100% { opacity: 0.4; transform: scale(0.85) }
          50% { opacity: 1; transform: scale(1.2) }
        }
        @keyframes dw-hub-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,235,18,0.65), 0 8px 18px rgba(0,0,0,0.25) }
          50% { box-shadow: 0 0 0 10px rgba(245,235,18,0), 0 8px 18px rgba(0,0,0,0.25) }
        }
        @keyframes dw-spark-float {
          0% { opacity: 0; transform: translateY(6px) scale(0.5) }
          50% { opacity: 1 }
          100% { opacity: 0; transform: translateY(-22px) scale(1.1) }
        }
        @keyframes dw-confetti {
          0% { opacity: 0; transform: translate(0,0) rotate(0deg) scale(0.6) }
          15% { opacity: 1 }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--tr)) scale(1) }
        }
        @keyframes dw-result-pop {
          0% { opacity: 0; transform: scale(0.55) translateY(10px) }
          60% { opacity: 1; transform: scale(1.1) translateY(-2px) }
          100% { opacity: 1; transform: scale(1) translateY(0) }
        }
        @keyframes dw-shimmer {
          0% { background-position: -120% 0 }
          100% { background-position: 220% 0 }
        }
        @keyframes dw-glow-pulse {
          0%, 100% { opacity: 0.45 }
          50% { opacity: 0.85 }
        }
        @keyframes dw-spin-ring {
          to { transform: rotate(360deg) }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Spin to win"
        className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 p-3 backdrop-blur-[3px] sm:p-4"
        style={{ animation: "dw-fade-in 240ms ease-out both" }}
        onClick={closePopup}
      >
        <div
          className="relative w-[min(94vw,560px)] max-h-[94vh] overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-ink bg-paper p-4 shadow-[0_25px_70px_-10px_rgba(0,0,0,0.45)] sm:p-6"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "dw-pop-in 360ms cubic-bezier(0.18,1.05,0.32,1.05) both" }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute left-[7%] top-[14%] h-1.5 w-1.5 rounded-full bg-yellow" style={{ animation: "dw-spark-float 2.4s ease-in-out 0.2s infinite" }} />
            <div className="absolute right-[10%] top-[10%] h-1 w-1 rounded-full bg-brand" style={{ animation: "dw-spark-float 2.8s ease-in-out 0.9s infinite" }} />
            <div className="absolute left-[12%] bottom-[28%] h-1 w-1 rounded-full bg-brand" style={{ animation: "dw-spark-float 2.6s ease-in-out 1.4s infinite" }} />
            <div className="absolute right-[14%] bottom-[20%] h-2 w-2 rounded-full bg-yellow" style={{ animation: "dw-spark-float 3s ease-in-out 0.4s infinite" }} />
            <div className="absolute left-1/2 top-[6%] h-1 w-1 rounded-full bg-yellow" style={{ animation: "dw-spark-float 2.2s ease-in-out 1.8s infinite" }} />
          </div>

          <button
            type="button"
            onClick={closePopup}
            className="absolute right-2.5 top-2.5 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-brand text-paper shadow-[0_3px_0_-1px_rgba(0,0,0,0.55)] transition-all hover:rotate-90 hover:scale-110 hover:bg-forest-deep active:translate-y-[1px] active:shadow-[0_1px_0_-1px_rgba(0,0,0,0.55)] sm:right-3 sm:top-3 sm:h-10 sm:w-10"
            aria-label="Close spin to win popup"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="mx-auto mt-1 w-full">
            <div className="relative mx-auto aspect-square w-full max-w-[min(74vw,360px)] sm:max-w-[420px]">
              <div
                aria-hidden
                className="absolute inset-[-14px] rounded-full"
                style={{
                  background: "radial-gradient(closest-side, rgba(245,235,18,0.55), transparent 72%)",
                  filter: "blur(10px)",
                  animation: "dw-glow-pulse 2.4s ease-in-out infinite",
                }}
              />

              <div
                className="absolute left-1/2 top-[-8px] z-30 -translate-x-1/2 sm:top-[-10px]"
                style={{ animation: spinning ? "none" : "dw-pointer-bob 1.6s ease-in-out infinite" }}
              >
                <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-ink drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)] sm:border-l-[15px] sm:border-r-[15px] sm:border-t-[26px]" />
                <div className="absolute left-1/2 top-[-2px] h-2 w-2 -translate-x-1/2 rounded-full border-2 border-ink bg-yellow" />
              </div>

              <div
                className="relative h-full w-full rounded-full border-[10px] border-ink bg-yellow shadow-[0_18px_36px_-8px_rgba(0,0,0,0.45),inset_0_-12px_24px_rgba(0,0,0,0.18)] sm:border-[12px]"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transition: "transform 4200ms cubic-bezier(0.15,0.9,0.2,1)",
                  backgroundImage:
                    "conic-gradient(#004fb0 0deg 60deg, #f5eb12 60deg 120deg, #004fb0 120deg 180deg, #f5eb12 180deg 240deg, #004fb0 240deg 300deg, #f5eb12 300deg 360deg)",
                }}
              >
                {PRIZES.map((_, i) => (
                  <div
                    key={`div-${i}`}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 h-1/2 w-[2px] origin-bottom -translate-x-1/2 bg-ink/15"
                    style={{ transform: `translateX(-50%) rotate(${i * segment}deg)`, transformOrigin: "50% 100%" }}
                  />
                ))}

                {PRIZES.map((prize, i) => {
                  const a = i * segment + segment / 2;
                  return (
                    <div
                      key={`${prize}-${i}`}
                      className="pointer-events-none absolute left-1/2 top-1/2"
                      style={{ transform: `translate(-50%, -50%) rotate(${a}deg) translateY(clamp(-150px, -28vw, -88px))` }}
                    >
                      <span
                        className="block whitespace-nowrap text-[12px] font-extrabold tracking-tight drop-shadow-[0_1px_0_rgba(0,0,0,0.35)] sm:text-[15px]"
                        style={{
                          transform: `rotate(${-a}deg)`,
                          color: i % 2 === 0 ? "#FFFFFF" : "#000000",
                        }}
                      >
                        {prize}
                      </span>
                    </div>
                  );
                })}
              </div>

              {RIM_LIGHTS.map((_, i) => {
                const a = (360 / RIM_LIGHTS.length) * i;
                return (
                  <div
                    key={`rim-${i}`}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{ transform: `rotate(${a}deg)` }}
                  >
                    <span
                      className="absolute left-1/2 top-[5px] block h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-paper sm:top-[7px] sm:h-[9px] sm:w-[9px]"
                      style={{
                        boxShadow: "0 0 8px rgba(255,255,255,0.95), 0 0 0 1.5px rgba(0,0,0,0.85)",
                        animation: `dw-rim-twinkle 1.4s ease-in-out ${(i * 0.12).toFixed(2)}s infinite`,
                      }}
                    />
                  </div>
                );
              })}

              <div
                className="absolute left-1/2 top-1/2 z-20 grid h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-paper sm:h-[68px] sm:w-[68px]"
                style={{ animation: "dw-hub-pulse 2.4s ease-in-out infinite" }}
              >
                <span className="text-[22px] font-black leading-none text-brand sm:text-[28px]">★</span>
              </div>
            </div>

            <div className="mx-auto mt-5 max-w-[600px] text-center sm:mt-7">
              <h2
                className="text-[30px] font-extrabold leading-none sm:text-[44px]"
                style={{
                  backgroundImage: "linear-gradient(90deg, #004fb0 0%, #4A7BC9 45%, #004fb0 100%)",
                  backgroundSize: "220% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  animation: "dw-shimmer 3.4s linear infinite",
                }}
              >
                Spin to win!
              </h2>
              <p className="mx-auto mt-2.5 max-w-[520px] text-[14px] font-medium leading-[1.4] text-ink-soft sm:mt-3 sm:text-[17px]">
                Enter your email and spin to claim 10% Off or Free Shipping!
              </p>

              <div className="mx-auto mt-4 grid max-w-[520px] gap-2.5 sm:mt-5 sm:gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={spinning || !!result}
                  className="h-12 rounded-xl border-2 border-ink/40 bg-paper px-4 text-[15px] font-medium text-ink-soft outline-none transition-all placeholder:text-ink-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60 sm:h-14 sm:px-5 sm:text-[17px]"
                />
                <button
                  type="button"
                  onClick={onSpin}
                  disabled={spinning || !!result}
                  className="group relative h-12 overflow-hidden rounded-xl border-2 border-ink bg-brand px-4 text-[16px] font-bold text-paper shadow-[0_6px_0_-1px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-[2px] hover:bg-forest-deep hover:shadow-[0_8px_0_-1px_rgba(0,0,0,0.5)] active:translate-y-[3px] active:shadow-[0_2px_0_-1px_rgba(0,0,0,0.5)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-[0_4px_0_-1px_rgba(0,0,0,0.5)] sm:h-14 sm:text-[19px]"
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    {spinning ? (
                      <>
                        <span
                          aria-hidden
                          className="h-4 w-4 rounded-full border-2 border-paper border-t-transparent sm:h-5 sm:w-5"
                          style={{ animation: "dw-spin-ring 0.8s linear infinite" }}
                        />
                        Spinning...
                      </>
                    ) : result ? (
                      "Check your email!"
                    ) : (
                      "Spin the wheel!"
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                </button>
              </div>

              {error ? (
                <p
                  className="mt-3 text-[14px] font-semibold text-danger sm:text-[15px]"
                  style={{ animation: "dw-pop-in 240ms ease-out both" }}
                >
                  {error}
                </p>
              ) : null}

              {result ? (
                <div className="relative mx-auto mt-4 inline-block">
                  <p
                    className="rounded-xl border-2 border-ink bg-yellow px-5 py-2.5 text-[18px] font-extrabold text-ink shadow-[0_4px_0_-1px_rgba(0,0,0,0.6)] sm:text-[22px]"
                    style={{ animation: "dw-result-pop 560ms cubic-bezier(0.18,1.2,0.32,1.05) both" }}
                  >
                    You won {result}!
                  </p>
                  <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-40 h-0 w-0">
                    {CONFETTI.map((_, i) => {
                      const theta = (Math.PI * 2 * i) / CONFETTI.length;
                      const dist = 90 + (i % 4) * 26;
                      const tx = Math.cos(theta) * dist;
                      const ty = Math.sin(theta) * dist - 30;
                      const tr = (i * 53) % 360;
                      return (
                        <span
                          key={`c-${i}`}
                          className="absolute block h-2 w-2 rounded-[2px]"
                          style={{
                            left: 0,
                            top: 0,
                            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                            ["--tx" as string]: `${tx}px`,
                            ["--ty" as string]: `${ty}px`,
                            ["--tr" as string]: `${tr}deg`,
                            animation: `dw-confetti 1.3s cubic-bezier(0.2,0.7,0.3,1) ${(i * 0.025).toFixed(3)}s forwards`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
