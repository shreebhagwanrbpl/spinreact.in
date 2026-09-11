"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";

import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  FileCheck,
  Cpu,
  ArrowRight,
} from "lucide-react";

/* =========================================================
   STATIC WORKFLOW
   Service data is NOT static.
   These are only the fixed workflow sections.
========================================================= */

const workflowSteps = [
  {
    step: "01",
    title: "Diagnostic Audit & Consultation",
    desc: "We analyze your hospital sample load, space constraints, and technical requirements to select the exact analyzer configuration.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Precision Solution Engineering",
    desc: "Custom lab layout designs, power backup specifications, and reagent supply schedule formulation.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Installation & NABL Calibration",
    desc: "Certified engineers perform physical installation, IQ/OQ/PQ protocols, and NABL-traceable reference calibration.",
    icon: Award,
  },
  {
    step: "04",
    title: "24/7 SLA Field Maintenance",
    desc: "Round-the-clock technical emergency support, scheduled preventive maintenance visits, and automated reagent restocking.",
    icon: Zap,
  },
];

export default function ServicesPage() {
  /* =========================================================
     SERVICES
     
     IMPORTANT:
     No fallbackServices here.
     Services come ONLY from Firebase.
  ========================================================= */

  const [services, setServices] = useState([]);

  const [contactInfo, setContactInfo] = useState([]);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     LOCATION / DISTRICT ROUTING
  ========================================================= */

  const pathname = usePathname();

  const pathParts = pathname
    .split("/")
    .filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "products",
    "contact",
    "items",
  ];

  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };

  /* =========================================================
     STATIC SERVICE ICONS
     
     Admin only stores title + description,
     so icons remain fixed in website code.
  ========================================================= */

  const icons = [
    <Microscope size={28} key={1} />,
    <FlaskConical size={28} key={2} />,
    <ShieldCheck size={28} key={3} />,
    <Stethoscope size={28} key={4} />,
    <Wrench size={28} key={5} />,
    <Activity size={28} key={6} />,
  ];

  /* =========================================================
     FIREBASE DATA
     
     WEBSITE:
     spinreactin
     
     SERVICES:
     websites/spinreactin/pages/services
     
     CONTACT:
     websites/spinreactin/pages/contact
  ========================================================= */

  useEffect(() => {
    const fetchServicesAndContact = async () => {
      try {
        const [servicesSnap, contactSnap] =
          await Promise.all([
            getDoc(
              doc(
                db,
                "websites",
                "spinreactin",
                "pages",
                "services"
              )
            ),

            getDoc(
              doc(
                db,
                "websites",
                "spinreactin",
                "pages",
                "contact"
              )
            ),
          ]);

        /* =====================================================
           SERVICES - DYNAMIC ONLY
           
           Admin structure:
           {
             title: "",
             desc: ""
           }
        ===================================================== */

        if (servicesSnap.exists()) {
          const firebaseServices =
            servicesSnap.data()?.services;

          if (
            Array.isArray(firebaseServices)
          ) {
            const dynamicServices =
              firebaseServices
                .map((service, index) => ({
                  id:
                    service.id ||
                    `firebase-service-${index}`,

                  title:
                    typeof service.title ===
                      "string"
                      ? service.title.trim()
                      : "",

                  desc:
                    typeof service.desc ===
                      "string"
                      ? service.desc.trim()
                      : "",
                }))
                .filter(
                  (service) =>
                    service.title ||
                    service.desc
                );

            setServices(dynamicServices);
          } else {
            setServices([]);
          }
        } else {
          setServices([]);
        }

        /* =====================================================
           CONTACT - DYNAMIC
        ===================================================== */

        if (contactSnap.exists()) {
          setContactInfo(
            contactSnap.data()?.contactInfo ||
            []
          );
        } else {
          setContactInfo([]);
        }
      } catch (error) {
        console.error(
          "Error loading services/contact data:",
          error
        );

        setServices([]);
        setContactInfo([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndContact();
  }, []);

  /* =========================================================
     DYNAMIC EMERGENCY PHONE
  ========================================================= */

  const emergencyPhone = (() => {
    const item = contactInfo.find((c) => {
      const label = (
        c?.label || ""
      ).toLowerCase();

      return (
        label.includes("phone") ||
        label.includes("mobile") ||
        label.includes("helpline") ||
        label.includes("emergency") ||
        label.includes("tel") ||
        label.includes("contact")
      );
    });

    if (!item) return "";

    if (Array.isArray(item.value)) {
      return item.value[0] || "";
    }

    return typeof item.value === "string"
      ? item.value.trim()
      : "";
  })();

  /* =========================================================
     PAGE UI
  ========================================================= */

  return (
    <div className="bg-white text-slate-900 selection:bg-[#0F172A] selection:text-white">

      {/* =====================================================
          PAGE BANNER
          Static page heading - NOT service data
      ===================================================== */}

      <PageBanner
        badge="Technical Services"
        title="Biomedical Support From Setup to Service"
        subtitle="NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup."
      />

      {/* =====================================================
          SERVICES GRID
          
          SERVICES ARE 100% FIREBASE DYNAMIC
      ===================================================== */}

      <section className="section-padding bg-white">
        <div className="container-custom">

          <SectionTitle
            badge="Full Service Catalog"
            title="Designed Around Reliable Operations"
            description="Explore our specialized services designed to keep clinical laboratories and hospital departments operating at peak accuracy."
            center
          />

          {/* =================================================
              LOADING STATE
          ================================================= */}

          {loading ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {[...Array(6)].map(
                (_, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl animate-pulse"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 mb-6" />

                    <div className="h-6 w-3/4 rounded bg-slate-200 mb-4" />

                    <div className="h-4 w-full rounded bg-slate-100 mb-2" />

                    <div className="h-4 w-5/6 rounded bg-slate-100" />
                  </div>
                )
              )}

            </div>
          ) : services.length > 0 ? (

            /* =================================================
               FIREBASE SERVICES
            ================================================= */

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {services.map(
                (service, index) => (
                  <ServiceCard
                    key={
                      service.id ||
                      index
                    }

                    /* Static icon */
                    icon={
                      icons[
                      index %
                      icons.length
                      ]
                    }

                    /* Dynamic Firebase title */
                    title={
                      service.title
                    }

                    /* Dynamic Firebase description */
                    description={
                      service.desc
                    }

                    /* No badge */
                    makeLink={makeLink}
                  />
                )
              )}

            </div>

          ) : (

            /* =================================================
               NO STATIC SERVICE FALLBACK
               
               If Firebase has no services,
               don't show any fake/static services.
            ================================================= */

            <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center max-w-2xl mx-auto">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-200">
                <Wrench size={28} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-800">
                No Services Available
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Our service catalog is
                currently being updated.
                Please contact our team
                for assistance.
              </p>

              <Link
                href={makeLink("/contact")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 transition-all"
              >
                <span>
                  Contact Us
                </span>

                <ArrowRight
                  size={16}
                />
              </Link>

            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          WORKFLOW PROCESS
          Static workflow - kept as existing website content
      ===================================================== */}

      <section className="section-padding bg-slate-50 border-y border-slate-200/80">
        <div className="container-custom">

          <SectionTitle
            badge="Execution Framework"
            title="Our 4-Step Engineering Workflow"
            description="A systematic process ensuring seamless integration, rapid compliance, and long-term instrument reliability."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

            {workflowSteps.map(
              (step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={index}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-500 hover:shadow-2xl hover:shadow-black/10"
                  >

                    <div>

                      <div className="flex items-center justify-between">

                        <span className="text-4xl font-black text-slate-300 group-hover:text-amber-500 transition-colors">
                          {step.step}
                        </span>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#0F172A] shadow-sm group-hover:bg-[#0F172A] group-hover:text-amber-400 transition-colors">
                          <Icon size={24} />
                        </div>

                      </div>

                      <h3 className="mt-6 text-xl font-black text-[#0F172A] group-hover:text-amber-600 transition-colors">
                        {step.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {step.desc}
                      </p>

                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-amber-700">
                        Phase {index + 1} Milestone
                      </span>
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>
      </section>

      {/* =====================================================
          EMERGENCY / SLA SECTION
      ===================================================== */}

      <section className="section-padding bg-white">
        <div className="container-custom">

          <div className="rounded-3xl border border-slate-800 bg-[#0F172A] p-8 sm:p-12 text-white shadow-2xl">

            <div className="grid lg:grid-cols-12 gap-8 items-center">

              <div className="lg:col-span-8">

                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Zap size={14} />
                  Emergency Breakdown Helpline
                </span>

                <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>

                <p className="mt-3 text-base text-slate-300 leading-relaxed">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-200">

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-amber-400"
                    />
                    <span>
                      2-Hour On-Site SLA
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-amber-400"
                    />
                    <span>
                      Loaner Analyzer Option
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-amber-400"
                    />
                    <span>
                      NABL Re-calibration Included
                    </span>
                  </div>

                </div>

              </div>

              {/* =================================================
                  EMERGENCY CONTACT
                  Phone comes from Firebase
              ================================================= */}

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Emergency Dispatch
                </p>

                {emergencyPhone ? (

                  <a
                    href={`tel:${emergencyPhone.replace(
                      /\s+/g,
                      ""
                    )}`}
                    className="mt-2 text-2xl font-black text-white hover:text-amber-400 transition-colors inline-block"
                  >
                    {emergencyPhone}
                  </a>

                ) : (

                  <p className="mt-2 text-sm text-slate-400">
                    24/7 Field Dispatch Active
                  </p>

                )}

                <Link
                  href={makeLink("/contact")}
                  className="mt-5 w-full rounded-2xl bg-amber-500 text-slate-950 py-3.5 text-center text-sm font-bold shadow-lg transition-all hover:bg-amber-400"
                >
                  Book Priority Repair
                </Link>

              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}