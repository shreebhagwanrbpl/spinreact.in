import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-slate-100" />
        <div className="mb-4 h-7 w-3/4 rounded bg-slate-200" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 w-11/12 rounded bg-slate-100" />
          <div className="h-4 w-8/12 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/10">
      <div>
        {/* Top bar with Icon & Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-amber-500 transition-all duration-300 group-hover:bg-[#0F172A] group-hover:text-amber-400 group-hover:scale-105 shadow-sm border border-slate-200/60">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-2xl font-black text-[#0F172A] transition-colors duration-300 group-hover:text-amber-600">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Highlights List if present */}
        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
        {turnaround ? (
          <span className="text-xs font-semibold text-slate-500">
            SLA: <strong className="text-amber-600 font-bold">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-500">Certified Quality</span>
        )}

        <Link
          href={makeLink("/contact")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 transition-all group-hover:translate-x-1 group-hover:text-[#0F172A]"
        >
          <span>Book Service</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}