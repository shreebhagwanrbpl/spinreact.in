"use client";

import { motion } from "framer-motion";

export default function PageBanner({ title, subtitle, badge = "Raj Biomedical" }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white py-16 lg:py-24 border-b border-slate-200/80">
      {/* Background Subtle Accent Spheres */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />

      {/* Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-[#0F172A] shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {badge}
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 font-medium">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}