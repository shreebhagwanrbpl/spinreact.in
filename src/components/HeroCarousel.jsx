"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react";

/* =========================================================
   STATIC IMAGE FALLBACKS
   IMPORTANT:
   These are ONLY for images.
   Title / Description / Button text have NO static fallback.
========================================================= */

const DEFAULT_STATIC_SLIDES = [
  {
    id: "static-hero-1",
    type: "image",
    url: "/hero-1.jpg",
  },
  {
    id: "static-hero-2",
    type: "image",
    url: "/hero-2.jpg",
  },
  {
    id: "static-hero-3",
    type: "image",
    url: "/hero-3.jpg",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const videoRefs = useRef({});

  /* =========================================================
     PARSE MEDIA FROM FIREBASE / FIRESTORE
  ========================================================= */

  const parseMediaList = (data) => {
    if (!data) return [];

    const list = [];

    /* -------------------------------------------------------
       1. Slides array
       Supports:
       title
       description
       button1Text
       button1Link
       button2Text
       button2Link
       image/video
    ------------------------------------------------------- */

    if (Array.isArray(data.slides) && data.slides.length > 0) {
      data.slides.forEach((item, idx) => {
        if (!item) return;

        const url =
          typeof item === "string"
            ? item
            : item.url ||
            item.image ||
            item.imageUrl ||
            item.video ||
            item.videoUrl;

        if (url) {
          const type =
            item.type ||
            (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
              ? "video"
              : "image");

          list.push({
            id: `slide-${idx}`,
            type,
            url,

            // Dynamic text from Firebase only
            title: item.title || item.heading || "",

            description:
              item.description ||
              item.subtitle ||
              item.desc ||
              "",

            button1Text:
              item.button1Text ||
              item.buttonText ||
              item.btnText ||
              "",

            button1Link:
              item.button1Link ||
              item.buttonLink ||
              item.btnLink ||
              "",

            button2Text:
              item.button2Text ||
              item.btn2Text ||
              "",

            button2Link:
              item.button2Link ||
              item.btn2Link ||
              "",

            badge: item.badge || item.tagline || "",
          });
        }
      });
    }

    /* -------------------------------------------------------
       2. Media array
    ------------------------------------------------------- */

    if (
      list.length === 0 &&
      Array.isArray(data.media) &&
      data.media.length > 0
    ) {
      data.media.forEach((item, idx) => {
        if (!item) return;

        const url =
          typeof item === "string"
            ? item
            : item.url || item.image || item.video;

        if (url) {
          const type =
            item.type ||
            (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
              ? "video"
              : "image");

          list.push({
            id: `media-${idx}`,
            type,
            url,
            title: item.title || "",
            description:
              item.description ||
              item.subtitle ||
              "",
          });
        }
      });
    }

    /* -------------------------------------------------------
       3. Banners array
    ------------------------------------------------------- */

    if (
      list.length === 0 &&
      Array.isArray(data.banners) &&
      data.banners.length > 0
    ) {
      data.banners.forEach((item, idx) => {
        if (!item) return;

        const url =
          typeof item === "string"
            ? item
            : item.url || item.image;

        if (url) {
          list.push({
            id: `banner-${idx}`,
            type: "image",
            url,
            title: item.title || "",
            description: item.description || "",
          });
        }
      });
    }

    /* -------------------------------------------------------
       4. Images array
    ------------------------------------------------------- */

    if (
      list.length === 0 &&
      Array.isArray(data.images) &&
      data.images.length > 0
    ) {
      data.images.forEach((url, idx) => {
        if (url && typeof url === "string") {
          list.push({
            id: `img-${idx}`,
            type: "image",
            url,
          });
        }
      });
    }

    /* -------------------------------------------------------
       5. Single imageUrl / image
    ------------------------------------------------------- */

    if (
      list.length === 0 &&
      (data.imageUrl || data.image)
    ) {
      const singleImg = data.imageUrl || data.image;

      if (
        typeof singleImg === "string" &&
        singleImg.trim()
      ) {
        list.push({
          id: "single-img",
          type: "image",
          url: singleImg.trim(),
        });
      }
    }

    /* -------------------------------------------------------
       6. Videos array
    ------------------------------------------------------- */

    if (
      Array.isArray(data.videos) &&
      data.videos.length > 0
    ) {
      data.videos.forEach((vUrl, idx) => {
        if (
          vUrl &&
          typeof vUrl === "string" &&
          !list.some((item) => item.url === vUrl)
        ) {
          list.push({
            id: `vid-${idx}`,
            type: "video",
            url: vUrl.trim(),
          });
        }
      });
    }

    /* -------------------------------------------------------
       7. Single videoUrl / video
    ------------------------------------------------------- */

    if (
      (data.videoUrl || data.video) &&
      !list.some(
        (item) =>
          item.url ===
          (data.videoUrl || data.video)
      )
    ) {
      const v = data.videoUrl || data.video;

      if (
        typeof v === "string" &&
        v.trim()
      ) {
        list.push({
          id: "single-vid",
          type: "video",
          url: v.trim(),
        });
      }
    }

    return list;
  };

  /* =========================================================
     SLIDES
     
     Firebase slides are preferred.
     If Firebase has no image/media, static image slides
     are used as fallback.
  ========================================================= */

  const dbSlides = parseMediaList(homeData);

  const slides =
    dbSlides.length > 0
      ? dbSlides
      : DEFAULT_STATIC_SLIDES;

  const activeSlide =
    slides[currentSlide] ||
    slides[0] ||
    null;

  /* =========================================================
     DYNAMIC TITLE
     
     NO STATIC FALLBACK
  ========================================================= */

  const heroTitle =
    activeSlide?.title?.trim() ||
    homeData?.title?.trim() ||
    homeData?.heading?.trim() ||
    homeData?.heroTitle?.trim() ||
    "";

  /* =========================================================
     DYNAMIC DESCRIPTION
     
     NO STATIC FALLBACK
  ========================================================= */

  const heroDescription =
    activeSlide?.description?.trim() ||
    homeData?.description?.trim() ||
    homeData?.subtitle?.trim() ||
    homeData?.desc?.trim() ||
    homeData?.heroDescription?.trim() ||
    "";

  /* =========================================================
     DYNAMIC BUTTON 1 TEXT
     
     NO STATIC TEXT FALLBACK
  ========================================================= */

  const rawBtn1Text =
    activeSlide?.button1Text?.trim() ||
    homeData?.button1Text?.trim() ||
    homeData?.buttonText?.trim() ||
    homeData?.btnText?.trim() ||
    homeData?.primaryButtonText?.trim() ||
    "";

  /* =========================================================
     BUTTON 1 LINK
     
     Link fallback remains so navigation doesn't break.
  ========================================================= */

  const rawBtn1Link =
    activeSlide?.button1Link?.trim() ||
    homeData?.button1Link?.trim() ||
    homeData?.buttonLink?.trim() ||
    homeData?.btnLink?.trim() ||
    homeData?.primaryButtonLink?.trim() ||
    "/items";

  /* =========================================================
     DYNAMIC BUTTON 2 TEXT
     
     NO STATIC TEXT FALLBACK
  ========================================================= */

  const rawBtn2Text =
    activeSlide?.button2Text?.trim() ||
    homeData?.button2Text?.trim() ||
    homeData?.secondaryButtonText?.trim() ||
    homeData?.btn2Text?.trim() ||
    "";

  /* =========================================================
     BUTTON 2 LINK
     
     Link fallback remains so navigation doesn't break.
  ========================================================= */

  const rawBtn2Link =
    activeSlide?.button2Link?.trim() ||
    homeData?.button2Link?.trim() ||
    homeData?.secondaryButtonLink?.trim() ||
    homeData?.btn2Link?.trim() ||
    "/contact";

  /* =========================================================
     DYNAMIC BADGE
  ========================================================= */

  const dynamicBadge =
    activeSlide?.badge?.trim() ||
    homeData?.badge?.trim() ||
    homeData?.tagline?.trim() ||
    homeData?.topBadge?.trim() ||
    (locationTitle
      ? `Leading Biomedical Supplier in ${locationTitle}`
      : "");

  /* =========================================================
     DYNAMIC TRUST BADGES
  ========================================================= */

  const dynamicTrustBadges =
    Array.isArray(homeData?.trustBadges)
      ? homeData.trustBadges
      : Array.isArray(homeData?.badges)
        ? homeData.badges
        : [];

  /* =========================================================
     FINAL LINKS
  ========================================================= */

  const btn1Href =
    rawBtn1Link.startsWith("http")
      ? rawBtn1Link
      : makeLink(rawBtn1Link);

  const btn2Href =
    rawBtn2Link.startsWith("http")
      ? rawBtn2Link
      : makeLink(rawBtn2Link);

  /* =========================================================
     AUTO SLIDE
  ========================================================= */

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % slides.length
      );
    }, 5500);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, currentSlide]);

  /* =========================================================
     SAFE SLIDE INDEX
  ========================================================= */

  useEffect(() => {
    if (
      currentSlide >= slides.length &&
      slides.length > 0
    ) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  /* =========================================================
     PLAY VIDEO
  ========================================================= */

  useEffect(() => {
    if (activeSlide?.type === "video") {
      const vid =
        videoRefs.current[currentSlide];

      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => { });
      }
    }
  }, [currentSlide, activeSlide]);

  /* =========================================================
     PREVIOUS SLIDE
  ========================================================= */

  const handlePrev = () => {
    if (slides.length <= 1) return;

    setCurrentSlide(
      (prev) =>
        (prev - 1 + slides.length) %
        slides.length
    );
  };

  /* =========================================================
     NEXT SLIDE
  ========================================================= */

  const handleNext = () => {
    if (slides.length <= 1) return;

    setCurrentSlide(
      (prev) =>
        (prev + 1) % slides.length
    );
  };

  /* =========================================================
     TOUCH SWIPE
  ========================================================= */

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(
      e.targetTouches[0].clientX
    );
  };

  const onTouchMove = (e) => {
    setTouchEnd(
      e.targetTouches[0].clientX
    );
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance =
      touchStart - touchEnd;

    const isLeftSwipe =
      distance > minSwipeDistance;

    const isRightSwipe =
      distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <section className="relative overflow-hidden bg-[#070B14] text-white">
      {/* =====================================================
          BACKGROUND MEDIA
      ===================================================== */}

      <div
        className="relative w-full h-[380px] sm:h-[440px] md:h-[490px] lg:h-[530px] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{
                opacity: 0,
                scale: 1.02,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* =================================================
                  VIDEO
              ================================================= */}

              {activeSlide?.type === "video" ? (
                <video
                  ref={(el) =>
                  (videoRefs.current[
                    currentSlide
                  ] = el)
                  }
                  src={activeSlide.url}
                  className="w-full h-full object-cover object-center"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onError={(e) => {
                    e.currentTarget.poster =
                      "/hero-1.jpg";
                  }}
                />
              ) : (
                /* ===============================================
                   IMAGE

                   Firebase image is used first.
                   If image fails -> /hero-1.jpg
                =============================================== */

                <img
                  src={
                    activeSlide?.url ||
                    "/hero-1.jpg"
                  }
                  alt={
                    heroTitle ||
                    `Hero Slide ${currentSlide + 1
                    }`
                  }
                  className="w-full h-full object-cover object-center brightness-[0.95] contrast-[1.05]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "/hero-1.jpg";
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* =====================================================
             FALLBACK BACKGROUND
          ===================================================== */

          <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#070B14]" />
        )}

        {/* =====================================================
            GRADIENT OVERLAYS
        ===================================================== */}

        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/95 via-[#0B0F19]/70 to-transparent lg:w-3/5" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-black/40" />

        {/* =====================================================
            FOREGROUND CONTENT
        ===================================================== */}

        <div className="container-custom relative z-20 h-full flex flex-col justify-center py-6 sm:py-8">
          <div className="max-w-2xl lg:max-w-3xl">

            {/* =================================================
                DYNAMIC BADGE
            ================================================= */}

            {dynamicBadge && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-black/60 px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300 shadow-lg backdrop-blur-md"
              >
                <Sparkles
                  size={14}
                  className="text-amber-400 animate-pulse"
                />

                <span>
                  {dynamicBadge}
                </span>
              </motion.div>
            )}

            {/* =================================================
                DYNAMIC TITLE
                No static fallback
            ================================================= */}

            {heroTitle && (
              <motion.h1
                key={`title-${currentSlide}-${heroTitle}`}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                }}
                className="mt-3 sm:mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl leading-[1.14] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              >
                {heroTitle}
              </motion.h1>
            )}

            {/* =================================================
                DYNAMIC DESCRIPTION
                No static fallback
            ================================================= */}

            {heroDescription && (
              <motion.p
                key={`desc-${currentSlide}-${heroDescription}`}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                }}
                className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base leading-relaxed text-slate-200 max-w-2xl font-medium line-clamp-3 md:line-clamp-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              >
                {heroDescription}
              </motion.p>
            )}

            {/* =================================================
                DYNAMIC BUTTONS
            ================================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.3,
              }}
              className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3"
            >

              {/* =================================================
                  BUTTON 1
                  Text ONLY from Firebase
              ================================================= */}

              {rawBtn1Text && (
                <Link
                  href={btn1Href}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-950 px-6 py-3 text-xs sm:text-sm font-bold shadow-xl shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <span>
                    {rawBtn1Text}
                  </span>

                  <ArrowRight size={16} />
                </Link>
              )}

              {/* =================================================
                  BUTTON 2
                  Text ONLY from Firebase

                  HOVER:
                  Text -> Yellow
              ================================================= */}

              {rawBtn2Text && (
                <Link
                  href={btn2Href}
                  className="group flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-black/60 text-white px-6 py-3 text-xs sm:text-sm font-bold backdrop-blur-md shadow-md transition-all duration-300 hover:bg-white hover:border-amber-400 hover:-translate-y-0.5"
                >
                  <PhoneCall
                    size={16}
                    className="text-amber-400 transition-colors duration-300"
                  />

                  <span className="transition-colors duration-300 group-hover:text-amber-400">
                    {rawBtn2Text}
                  </span>
                </Link>
              )}

            </motion.div>

            {/* =================================================
                DYNAMIC TRUST BADGES
            ================================================= */}

            {dynamicTrustBadges.length > 0 && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.4,
                }}
                className="mt-5 hidden sm:flex flex-wrap items-center gap-5 border-t border-white/15 pt-4 text-xs font-semibold text-slate-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
              >
                {dynamicTrustBadges.map(
                  (badgeText, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-amber-400 shrink-0"
                      />

                      <span>
                        {typeof badgeText ===
                          "string"
                          ? badgeText
                          : badgeText?.text}
                      </span>
                    </div>
                  )
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* =====================================================
            CAROUSEL CONTROLS
        ===================================================== */}

        {slides.length > 1 && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">

            {/* =================================================
                PLAY / PAUSE
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setIsPlaying(!isPlaying)
              }
              title={
                isPlaying
                  ? "Pause Slideshow"
                  : "Play Slideshow"
              }
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-black/85 transition-all shadow-md cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
            </button>

            {/* =================================================
                PREVIOUS
            ================================================= */}

            <button
              type="button"
              onClick={handlePrev}
              title="Previous Slide"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all shadow-md cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            {/* =================================================
                COUNTER
            ================================================= */}

            <div className="flex items-center gap-1.5 rounded-xl bg-black/70 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-200 backdrop-blur-md border border-white/30 shadow-md">
              {activeSlide?.type === "video" ? (
                <Film
                  size={12}
                  className="text-amber-400"
                />
              ) : (
                <ImageIcon
                  size={12}
                  className="text-amber-400"
                />
              )}

              <span>
                {currentSlide + 1} /{" "}
                {slides.length}
              </span>
            </div>

            {/* =================================================
                NEXT
            ================================================= */}

            <button
              type="button"
              onClick={handleNext}
              title="Next Slide"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all shadow-md cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* =====================================================
            PAGINATION DOTS
        ===================================================== */}

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setCurrentSlide(idx)
                }
                aria-label={`Go to slide ${idx + 1
                  }`}
                className={`transition-all duration-300 rounded-full h-2 sm:h-2.5 cursor-pointer ${currentSlide === idx
                  ? "w-6 sm:w-8 bg-amber-400 shadow-md shadow-amber-400/60"
                  : "w-2 sm:w-2.5 bg-white/60 hover:bg-white"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}