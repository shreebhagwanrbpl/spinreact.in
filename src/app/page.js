"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  PhoneCall,
  Mail,
  Wrench,
  Award,
  Clock,
  Zap,
} from "lucide-react";

import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import ProductHorizontalRail from "@/components/ProductHorizontalRail";
import ContactForm from "@/components/ContactForm";
import HeroCarousel from "@/components/HeroCarousel";

import { fallbackProducts } from "@/data/productsData";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

const stats = [
  {
    number: "5,000+",
    title: "Healthcare Partners",
    desc: "Hospitals & labs served nationwide",
    icon: Building2,
  },
  {
    number: "3,500+",
    title: "Products & Kits",
    desc: "Precision diagnostic instruments",
    icon: Microscope,
  },
  {
    number: "10+ Yrs",
    title: "Engineering Excellence",
    desc: "Proven biomedical leadership",
    icon: ShieldCheck,
  },
  {
    number: "99.9%",
    title: "Accuracy SLA",
    desc: "NABL & ISO certified standards",
    icon: Award,
  },
];

const pillars = [
  {
    title: "Certified Calibration Standards",
    desc: "Every diagnostic analyzer undergoes NABL-traceable calibration to ensure precise patient diagnostics and regulatory safety.",
    icon: Award,
    badge: "ISO 13485 Certified",
  },
  {
    title: "24/7 Emergency AMC Response",
    desc: "Our nationwide team of biomedical engineers delivers rapid on-site maintenance to keep critical ICU and OT gear active.",
    icon: Zap,
    badge: "2-Hour SLA",
  },
  {
    title: "Turnkey Lab Setup & Engineering",
    desc: "From architectural workflow layout to instrument installation and staff certification, we engineer complete pathology labs.",
    icon: Building2,
    badge: "Turnkey Engineering",
  },
  {
    title: "Cold-Chain Reagent Supply",
    desc: "Strictly temperature-monitored distribution of biochemistry reagents, controls, and rapid assay kits with extended shelf life.",
    icon: FlaskConical,
    badge: "Monitored Cold Chain",
  },
];

const testimonials = [
  {
    quote:
      "Raj Biomedical transformed our central laboratory setup. Their automated analyzers increased our daily sample throughput by 40% with zero downtime.",
    author: "Dr. Arvind Sharma",
    role: "Chief Pathologist",
    institution: "Apollo Diagnostics Center",
    rating: 5,
  },
  {
    quote:
      "The 24/7 AMC response team is outstanding. When our ICU patient monitor system faced a sensor issue, their engineer arrived within 90 minutes.",
    author: "Dr. Meenakshi Sundaram",
    role: "Medical Director",
    institution: "Metro Multispecialty Hospital",
    rating: 5,
  },
  {
    quote:
      "Their cold-chain reagent delivery has never failed us. Quality control results are consistently accurate, month after month.",
    author: "Rajesh Varma",
    role: "Laboratory Operations Manager",
    institution: "LifeCare PathLabs",
    rating: 5,
  },
];

export default function Home({ city }) {
  // Services are ONLY loaded from Firebase.
  // No fallback service data.
  const [services, setServices] = useState([]);

  // Product fallback behavior remains unchanged.
  const [products, setProducts] = useState(fallbackProducts);

  const [homeData, setHomeData] = useState(null);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "items",
    "contact",
    "products",
  ];

  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const locationTitle =
    city || (district ? district.replace(/-/g, " ") : "");

  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ============================================
        // FETCH HOME PAGE CONFIGURATION
        // ============================================
        try {
          const homeSnap = await getDoc(
            doc(db, "websites", "spinreactin", "pages", "home")
          );

          if (homeSnap.exists()) {
            setHomeData(homeSnap.data());
          }
        } catch (homeErr) {
          console.error("Error fetching home data:", homeErr);
        }

        // ============================================
        // FETCH CONTACT INFORMATION
        // ============================================
        try {
          const contactSnap = await getDoc(
            doc(db, "websites", "spinreactin", "pages", "contact")
          );

          if (contactSnap.exists()) {
            setContactInfo(
              contactSnap.data().contactInfo || []
            );
          }
        } catch (contactErr) {
          console.error("Error fetching contact data:", contactErr);
        }

        // ============================================
        // FETCH SERVICES - FIREBASE ONLY
        // ============================================
        try {
          const serviceSnap = await getDoc(
            doc(
              db,
              "websites",
              "spinreactin",
              "pages",
              "services"
            )
          );

          if (serviceSnap.exists()) {
            const firebaseServices =
              serviceSnap.data().services;

            if (Array.isArray(firebaseServices)) {
              const dbServices = firebaseServices
                .map((service, idx) => ({
                  id: service.id || `service-${idx}`,
                  title:
                    typeof service.title === "string"
                      ? service.title.trim()
                      : "",
                  desc:
                    typeof service.desc === "string"
                      ? service.desc.trim()
                      : "",
                }))
                .filter(
                  (service) =>
                    service.title || service.desc
                );

              setServices(dbServices);
            } else {
              setServices([]);
            }
          } else {
            setServices([]);
          }
        } catch (serviceErr) {
          console.error(
            "Error fetching services:",
            serviceErr
          );

          // IMPORTANT:
          // Never use fallback services.
          setServices([]);
        }

        // ============================================
        // FETCH PRODUCTS DYNAMICALLY FROM FIRESTORE
        // ============================================
        try {
          const fetchedProducts =
            await fetchAllDynamicProducts();

          if (
            fetchedProducts &&
            fetchedProducts.length > 0
          ) {
            setProducts(fetchedProducts);
          }
        } catch (productErr) {
          console.error(
            "Error fetching products:",
            productErr
          );
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================
  // STATIC SERVICE ICONS
  // Title + Description are dynamic from Firebase.
  // Icons remain static.
  // ============================================
  const serviceIcons = [
    <Microscope size={28} key={1} />,
    <Building2 size={28} key={2} />,
    <Wrench size={28} key={3} />,
    <FlaskConical size={28} key={4} />,
    <Stethoscope size={28} key={5} />,
    <Award size={28} key={6} />,
  ];

  // ============================================
  // DYNAMIC PHONE
  // ============================================
  const helplinePhone = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label?.toLowerCase().includes("phone") ||
        c?.label?.toLowerCase().includes("mobile") ||
        c?.label?.toLowerCase().includes("helpline") ||
        c?.label?.toLowerCase().includes("contact")
    );

    if (!item) return "";

    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }

    return typeof item.value === "string"
      ? item.value.trim()
      : "";
  })();

  // ============================================
  // DYNAMIC EMAIL
  // ============================================
  const supportEmail = (() => {
    const item = contactInfo.find(
      (c) =>
        c?.label?.toLowerCase().includes("email") ||
        c?.label?.toLowerCase().includes("mail")
    );

    if (!item) return "";

    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }

    return typeof item.value === "string"
      ? item.value.trim()
      : "";
  })();

  return (
    <div className="bg-white text-slate-900 selection:bg-[#0F172A] selection:text-white">

      {/* ================= DYNAMIC HERO BANNER & CAROUSEL ================= */}
      <HeroCarousel
        homeData={homeData}
        locationTitle={locationTitle}
        makeLink={makeLink}
      />

      {/* ================= STATS TICKER ================= */}
      <section className="bg-slate-50 py-10 text-slate-900 border-y border-slate-200/80 shadow-sm">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item, idx) => {
              const Icon = item.icon;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 border border-slate-200 shadow-sm">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                      {item.number}
                    </h3>

                    <p className="text-xs sm:text-sm font-bold text-amber-600">
                      {item.title}
                    </p>

                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PILLARS / WHY CHOOSE US ================= */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <SectionTitle
            badge="Why Modern Labs Choose Us"
            title="Engineering Excellence & Reliability"
            description="A modern, high-precision biomedical engineering infrastructure supporting healthcare workflows nationwide."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/10"
                >
                  <div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-amber-500 transition-all duration-300 group-hover:bg-[#0F172A] group-hover:text-amber-400 group-hover:scale-105 shadow-sm border border-slate-200/60">
                      <Icon size={28} />
                    </div>

                    <span className="mb-3 inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                      {pillar.badge}
                    </span>

                    <h3 className="mb-3 text-xl font-black text-[#0F172A] group-hover:text-amber-600 transition-colors">
                      {pillar.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-600">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-amber-600">
                    <span>Learn standard</span>

                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="section-padding bg-slate-50 border-y border-slate-200/80">
        <div className="container-custom">
          <ProductHorizontalRail
            products={products.slice(0, 3)}
            makeLink={makeLink}
            title="Equipment Worth Exploring"
            badge="Diagnostic Inventory"
            description="Explore our curated catalog of automated clinical chemistry analyzers, hematology counters, PCR units, and diagnostic instrumentation."
          />
        </div>
      </section>

      {/* ================= SERVICES MATRIX ================= */}
      <section className="section-padding bg-white">
        <div className="container-custom">

          <SectionTitle
            badge="Healthcare Solutions"
            title="Support Built Around Your Workflow"
            description="From NABL-certified calibration to 2-hour emergency repair response, our certified engineers support your clinical operations round the clock."
            center
          />

          {loading ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 rounded-3xl border border-slate-200 bg-slate-50 animate-pulse"
                />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((srv, idx) => (
                <ServiceCard
                  key={srv.id || idx}
                  icon={
                    serviceIcons[
                    idx % serviceIcons.length
                    ]
                  }
                  title={srv.title}
                  description={srv.desc}
                  makeLink={makeLink}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 border border-slate-200">
                  <Wrench size={26} />
                </div>

                <h3 className="text-lg font-bold text-[#0F172A]">
                  No Services Available
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Services will appear here once they are
                  added from the admin panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= ISO & QUALITY CERTIFICATION BANNER ================= */}
      <section className="section-padding bg-slate-50 border-y border-slate-200/80">
        <div className="container-custom">
          <div className="rounded-3xl bg-[#0F172A] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden border border-slate-800 shadow-2xl">

            <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">

              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Award size={16} />
                  Quality Assurance & Compliance
                </span>

                <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Uncompromised Clinical Accuracy & Regulatory Standards
                </h2>

                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                  Raj Biosis strictly adheres to international quality protocols. Every equipment installation comes with complete IQ/OQ/PQ validation documentation and certified calibration reports.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4">

                  <div className="rounded-2xl border border-slate-800 bg-[#0B0F19]/80 p-5 backdrop-blur-sm">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck
                        size={20}
                        className="text-amber-400"
                      />
                      ISO 13485 & CE Compliance
                    </h4>

                    <p className="mt-2 text-xs text-slate-400">
                      Certified medical device quality management system for diagnostic analyzers.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#0B0F19]/80 p-5 backdrop-blur-sm">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock
                        size={20}
                        className="text-amber-400"
                      />
                      2-Hour SLA Maintenance
                    </h4>

                    <p className="mt-2 text-xs text-slate-400">
                      Dedicated engineer dispatch team ready for emergency hospital repairs.
                    </p>
                  </div>

                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-3xl border border-slate-700/80 bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/90 p-8 backdrop-blur-md text-center shadow-2xl">

                  <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 border-2 border-amber-300 p-2">

                    <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                      100%
                    </span>

                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-900 mt-1">
                      Certified
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-white">
                    Compliance Guarantee
                  </h3>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    All instruments tested with traceable reference standards before dispatch to your medical facility.
                  </p>

                  <Link
                    href={makeLink("/contact")}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 text-slate-950 px-8 py-3.5 text-sm font-bold shadow-xl shadow-amber-500/30 transition-all hover:bg-amber-400 hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    <span className="font-bold">
                      Request Inspection Certificate
                    </span>

                    <ArrowRight size={16} />
                  </Link>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section-padding bg-white">
        <div className="container-custom">

          <SectionTitle
            badge="What Our Partners Say"
            title="Chosen by Diagnostic Teams"
            description="Read how healthcare professionals rely on Raj Biosis for accurate diagnostics and uninterrupted equipment uptime."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div>

                  <div className="flex gap-1 text-amber-500 mb-4 text-lg">
                    {Array.from({
                      length: t.rating,
                    }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-slate-700 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                </div>

                <div className="mt-8 border-t border-slate-100 pt-4 flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#0F172A] font-bold text-lg border border-slate-200">
                    {t.author.charAt(4) || "D"}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {t.author}
                    </h4>

                    <p className="text-xs text-slate-500">
                      {t.role} —{" "}
                      <span className="text-amber-600 font-medium">
                        {t.institution}
                      </span>
                    </p>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= QUICK INQUIRY FORM SECTION ================= */}
      <section className="section-padding bg-slate-50 border-t border-slate-200">
        <div className="container-custom">

          <div className="grid lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-5">
              <SectionTitle
                badge="Direct Consultation"
                title="Planning a Purchase or Need Technical Guidance?"
                description="Our biomedical engineering consultants will analyze your laboratory requirements, recommend optimal instruments, and provide a customized quote."
              />

              <div className="mt-8 space-y-4">

                {helplinePhone && (
                  <a
                    href={`tel:${String(
                      helplinePhone
                    ).replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md hover:border-amber-500/50 transition-colors group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] group-hover:bg-[#0F172A] group-hover:text-amber-400 transition-colors shrink-0">
                      <PhoneCall size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        Direct Helpline
                      </p>

                      <p className="text-base font-bold text-[#0F172A]">
                        {helplinePhone}
                      </p>
                    </div>
                  </a>
                )}

                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md hover:border-amber-500/50 transition-colors group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A] group-hover:bg-[#0F172A] group-hover:text-amber-400 transition-colors shrink-0">
                      <Mail size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        Official Email
                      </p>

                      <p className="text-base font-bold text-[#0F172A] break-all">
                        {supportEmail}
                      </p>
                    </div>
                  </a>
                )}

              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactForm
                title="Request a Tailored Equipment Plan"
                subtitle="Fill out the form below and our equipment specialist will reach out within 2 hours."
              />
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}