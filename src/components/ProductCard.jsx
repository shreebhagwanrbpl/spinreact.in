"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Microscope } from "lucide-react";
import { makeSlug } from "@/data/productsData";

export default function ProductCard({
  product,
  makeLink = (p) => p,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    id,
    title,
    category,
    subCategory,
    description,
    desc,
    specs = {},
    badge,
    status,
    availability,
    image,
    slug,
    brand,
    model,
    throughput,
    capacity,
    instrument,
    automation,
    usage,
    price,
  } = product;

  const productSlug = slug || makeSlug(title);
  const pdpLink = makeLink(`/items/${productSlug}`);
  const displayDesc = desc || description || "";

  const hasValidImage =
    image &&
    typeof image === "string" &&
    image.trim() !== "" &&
    image !== "/logo.png" &&
    !imgError;

  // Extract exactly 2-3 genuine dynamic specs that exist on the product from Admin
  const dynamicSpecs = [];
  if (brand && String(brand).trim() && String(brand).trim() !== "N/A") {
    dynamicSpecs.push(["Brand", String(brand).trim()]);
  }
  if (model && String(model).trim() && String(model).trim() !== "N/A") {
    dynamicSpecs.push(["Model", String(model).trim()]);
  }
  if (throughput && String(throughput).trim() && String(throughput).trim() !== "N/A") {
    dynamicSpecs.push(["Throughput", String(throughput).trim()]);
  } else if (capacity && String(capacity).trim() && String(capacity).trim() !== "N/A") {
    dynamicSpecs.push(["Capacity", String(capacity).trim()]);
  } else if (instrument && String(instrument).trim() && String(instrument).trim() !== "N/A") {
    dynamicSpecs.push(["Instrument", String(instrument).trim()]);
  } else if (automation && String(automation).trim() && String(automation).trim() !== "N/A") {
    dynamicSpecs.push(["Automation", String(automation).trim()]);
  } else if (usage && String(usage).trim() && String(usage).trim() !== "N/A") {
    dynamicSpecs.push(["Usage", String(usage).trim()]);
  }

  // If we have less than 2, pull from custom specs object if provided
  if (dynamicSpecs.length < 2 && specs && typeof specs === "object") {
    Object.entries(specs).forEach(([k, v]) => {
      if (
        dynamicSpecs.length < 3 &&
        v &&
        String(v).trim() &&
        String(v).trim() !== "N/A" &&
        !dynamicSpecs.some(([ek]) => ek.toLowerCase() === k.toLowerCase())
      ) {
        dynamicSpecs.push([k, String(v).trim()]);
      }
    });
  }

  const displayStatus = status || availability || "In Stock";

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/20 h-full">
      <div>
        {/* Image Container Link */}
        <Link
          href={pdpLink}
          className="relative block h-56 sm:h-60 w-full overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/60 p-4 border-b border-slate-100"
        >
          {hasValidImage ? (
            <>
              {/* Shimmer loading skeleton */}
              {!imgLoaded && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100 animate-pulse">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-amber-500">
                    <Microscope size={26} className="animate-bounce text-amber-500" />
                  </div>
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Loading Image...
                  </span>
                </div>
              )}

              <Image
                src={image}
                alt={title || "Biomedical Equipment"}
                fill
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`object-contain p-3 transition-all duration-500 group-hover:scale-105 ${
                  imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </>
          ) : (
            /* Premium Medical Instrument Placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/30 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-md border border-slate-200 text-amber-500 transition-transform duration-300 group-hover:scale-110">
                <Microscope size={32} />
              </div>
              <span className="mt-3 text-xs font-extrabold uppercase tracking-wider text-slate-800">
                {category || "Diagnostic Equipment"}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-amber-600">
                Certified Specification
              </span>
            </div>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            {badge ? (
              <span className="rounded-full border border-amber-500/30 bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-amber-600 shadow-sm">
                {badge}
              </span>
            ) : (
              <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-slate-800 shadow-sm truncate max-w-[150px]">
                {subCategory || category}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow-sm shrink-0">
              <ShieldCheck size={12} />
              {displayStatus}
            </span>
          </div>
        </Link>

        {/* Details Section */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 truncate">
              {subCategory && subCategory !== category ? `${category} • ${subCategory}` : category}
            </span>
          </div>

          <Link href={pdpLink} className="block mt-1.5">
            <h3 className="text-xl font-black text-[#0F172A] leading-tight group-hover:text-amber-600 transition-colors line-clamp-2 min-h-[52px]">
              {title}
            </h3>
          </Link>

          {displayDesc && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[40px]">
              {displayDesc}
            </p>
          )}

          {/* Key Dynamic Specs Box (Exact dark midnight styling with amber keys & light values) */}
          {dynamicSpecs.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#0F172A] border border-slate-800 p-3.5 space-y-2 text-xs shadow-inner">
              {dynamicSpecs.slice(0, 3).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center gap-2">
                  <span className="font-bold text-[#F59E0B] shrink-0">{key}:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[180px] text-right">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer Button (Exact dark midnight button with white text) */}
      <div className="p-6 pt-0 mt-2">
        <Link
          href={pdpLink}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] py-3.5 px-4 text-center text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[#1E293B] hover:shadow-xl group/btn"
        >
          <span className="text-white font-bold text-sm tracking-wide">
            Inquire Price & Specs
          </span>
          <ArrowRight size={16} className="text-white shrink-0 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
