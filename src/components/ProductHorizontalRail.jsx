"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductHorizontalRail({
  products = [],
  makeLink = (p) => p,
  title = "Equipment Worth Exploring",
  badge = "Diagnostic Inventory",
  description = "Explore our curated catalog of automated clinical analyzers, PCR units, ICU patient monitors, and laboratory centrifuges.",
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const railRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Check scroll positions
  const checkScroll = () => {
    const el = railRef.current;
    if (!el) return;

    const { scrollLeft: sLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(sLeft > 10);
    setCanScrollRight(sLeft < scrollWidth - clientWidth - 10);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (sLeft / maxScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  // Scroll buttons
  const scroll = (direction) => {
    const el = railRef.current;
    if (!el) return;

    const scrollAmount = Math.min(el.clientWidth * 0.8, 420);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e) => {
    const el = railRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = railRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeft.current - walk;
  };

  const isSmallSet = products.length <= 3;

  return (
    <div className="w-full">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          {badge && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{badge}</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0F172A] leading-tight">
            {title}
          </h2>

          {description && (
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Rail Navigation & View All Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={makeLink("/items")}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0F172A] border border-slate-800 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#1E293B] hover:scale-105 shrink-0 cursor-pointer"
          >
            <span className="text-white font-bold">View All Products</span>
            <ArrowRight size={15} className="text-white" />
          </Link>

          {/* Scroll Arrows only shown when more than 3 products */}
          {!isSmallSet && (
            <>
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll Rail Left"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 shadow-md ${
                  canScrollLeft
                    ? "bg-[#0F172A] border-slate-800 text-white hover:bg-[#1E293B] cursor-pointer"
                    : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-50"
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll Rail Right"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 shadow-md ${
                  canScrollRight
                    ? "bg-[#0F172A] border-slate-800 text-white hover:bg-[#1E293B] cursor-pointer"
                    : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-50"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= PRODUCTS DISPLAY (3-COLUMN GRID OR RAIL) ================= */}
      <div className="relative mt-10">
        {products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-md">
            <p className="text-base font-bold text-slate-800">
              No instruments available currently.
            </p>
          </div>
        ) : isSmallSet ? (
          /* Responsive 3-Column Grid for exactly 3 products */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                product={product}
                makeLink={makeLink}
              />
            ))}
          </div>
        ) : (
          /* Smooth Scrollable Horizontal Rail for larger lists */
          <div
            ref={railRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {products.map((product) => (
              <div
                key={product.id || product.slug}
                className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start h-full"
              >
                <ProductCard product={product} makeLink={makeLink} />
              </div>
            ))}
          </div>
        )}

        {/* Scroll Progress Bar for large sets */}
        {!isSmallSet && products.length > 2 && (
          <div className="mt-4 flex items-center justify-between gap-4 pt-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#0F172A] rounded-full transition-all duration-150"
                style={{ width: `${Math.max(15, scrollProgress)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
              <span>Swipe or scroll rail</span>
              <ArrowRight size={13} className="text-[#0F172A] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile View All button */}
      <div className="mt-8 sm:hidden text-center">
        <Link
          href={makeLink("/items")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F172A] border border-slate-800 py-3.5 text-sm font-bold text-white shadow-md"
        >
          <span className="text-white font-bold">View All Products</span>
          <ArrowRight size={16} className="text-white" />
        </Link>
      </div>
    </div>
  );
}
