"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import PageBanner from "@/components/PageBanner";
import ProductCard from "@/components/ProductCard";

import {
  fetchAllDynamicProducts,
  normalizeProduct,
} from "@/lib/fetchProducts";

import { subscribeToCatalog } from "@/lib/data-fetcher";

import {
  Search,
  X,
  Filter,
  Package,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";


function ProductsContent({ city }) {
  // ============================================
  // PRODUCTS - FIREBASE ONLY
  // NO FALLBACK DATA
  // ============================================
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlCategory = searchParams
    ? searchParams.get("category") ||
    searchParams.get("cat")
    : null;

  // ============================================
  // DISTRICT / LOCATION ROUTING
  // ============================================
  const pathParts = pathname
    .split("/")
    .filter(Boolean);

  const staticRoutes = [
    "about",
    "services",
    "items",
    "contact",
    "products",
  ];

  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : null;

  // ============================================
  // DYNAMIC LINK HELPER
  // ============================================
  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    if (path.startsWith("/items?")) {
      return `/${district}${path}`;
    }

    return `/${district}${path.startsWith("/") ? path : `/${path}`
      }`;
  };

  // ============================================
  // LOAD PRODUCTS
  // FIREBASE ONLY
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadInitialProducts = async () => {
      try {
        const fetched =
          await fetchAllDynamicProducts();

        if (!isMounted) return;

        if (
          Array.isArray(fetched) &&
          fetched.length > 0
        ) {
          setProducts(fetched);
        } else {
          // No Firebase products = empty catalog
          setProducts([]);
        }
      } catch (err) {
        console.error(
          "Error loading dynamic products:",
          err
        );

        // IMPORTANT:
        // Never use fallback products
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialProducts();

    // ============================================
    // REAL-TIME FIRESTORE CATALOG
    // ============================================
    const unsubscribe = subscribeToCatalog(
      (updatedCatalog) => {
        if (!isMounted) return;

        if (Array.isArray(updatedCatalog)) {
          const normalized = updatedCatalog
            .map((item) => normalizeProduct(item))
            .filter(Boolean);

          setProducts(normalized);
        } else {
          setProducts([]);
        }
      }
    );

    return () => {
      isMounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // ============================================
  // DYNAMIC CATEGORY LIST
  // ============================================
  const categoriesList = useMemo(() => {
    const setCat = new Set([
      "All Categories",
    ]);

    products.forEach((p) => {
      const cat =
        typeof p.category === "string"
          ? p.category.trim()
          : "";

      if (
        cat &&
        cat.toLowerCase() !==
        "all categories"
      ) {
        setCat.add(cat);
      }
    });

    return Array.from(setCat).filter(Boolean);
  }, [products]);

  // ============================================
  // SYNC CATEGORY FROM URL
  // ============================================
  useEffect(() => {
    if (
      urlCategory &&
      typeof urlCategory === "string" &&
      urlCategory.trim()
    ) {
      const decoded = decodeURIComponent(
        urlCategory.trim()
      );

      setSelectedCategory(decoded);
    }
  }, [urlCategory]);

  // ============================================
  // FILTER PRODUCTS
  // ============================================
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory ===
        "All Categories" ||
        (product.category &&
          product.category
            .toLowerCase()
            .trim() ===
          selectedCategory
            .toLowerCase()
            .trim()) ||
        (product.subCategory &&
          product.subCategory
            .toLowerCase()
            .trim() ===
          selectedCategory
            .toLowerCase()
            .trim());

      const q = searchQuery
        .toLowerCase()
        .trim();

      const matchesQuery =
        !q ||
        (product.title &&
          product.title
            .toLowerCase()
            .includes(q)) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(q)) ||
        (product.category &&
          product.category
            .toLowerCase()
            .includes(q)) ||
        (product.brand &&
          product.brand
            .toLowerCase()
            .includes(q)) ||
        (product.model &&
          product.model
            .toLowerCase()
            .includes(q));

      return (
        matchesCategory &&
        matchesQuery
      );
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
  ]);

  return (
    <div className="bg-white text-slate-900 selection:bg-[#0F172A] selection:text-white">

      {/* ================= BANNER ================= */}
      <PageBanner
        badge="Product Inventory"
        title={
          city
            ? `Diagnostic Equipment Collection in ${city}`
            : "Diagnostic Equipment Collection"
        }
        subtitle="Explore our certified catalog of clinical chemistry analyzers, hematology counters, PCR systems, patient monitors, and laboratory consumables."
      />

      {/* ================= MAIN CATALOG ================= */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">

          {/* ================= CONTROLS BAR ================= */}
          <div className="sticky top-20 z-40 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl p-4 sm:p-5 shadow-lg transition-all">

            <div className="grid gap-4 md:grid-cols-12 items-center">

              {/* ================= SEARCH ================= */}
              <div className="md:col-span-5 relative">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  placeholder="Search by equipment name, model, or parameter..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 transition-all focus:border-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />

                {searchQuery && (
                  <button
                    onClick={() =>
                      setSearchQuery("")
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              {/* ================= CATEGORY FILTER ================= */}
              <div className="md:col-span-7 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">

                <Filter
                  size={16}
                  className="text-[#0F172A] shrink-0 mr-1"
                />

                {categoriesList.map(
                  (cat) => {
                    const isCatActive =
                      selectedCategory
                        .toLowerCase()
                        .trim() ===
                      cat
                        .toLowerCase()
                        .trim();

                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setSelectedCategory(
                            cat
                          )
                        }
                        className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${isCatActive
                          ? "bg-[#0F172A] text-white shadow-md font-bold scale-105"
                          : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-[#0F172A]"
                          }`}
                      >
                        <span
                          className={
                            isCatActive
                              ? "text-white font-bold"
                              : "text-slate-700 font-semibold"
                          }
                        >
                          {cat ||
                            "All Categories"}
                        </span>
                      </button>
                    );
                  }
                )}

              </div>
            </div>

            {/* ================= RESULTS COUNT ================= */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-semibold text-slate-600">

              <span>
                Showing{" "}
                <strong className="text-[#0F172A] font-bold">
                  {filteredProducts.length}
                </strong>{" "}
                of {products.length}{" "}
                instruments

                {selectedCategory !==
                  "All Categories" && (
                    <span className="ml-1 text-amber-700 font-bold">
                      in &ldquo;
                      {selectedCategory}
                      &rdquo;
                    </span>
                  )}
              </span>

              {(selectedCategory !==
                "All Categories" ||
                searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(
                        "All Categories"
                      );
                      setSearchQuery("");
                    }}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Reset all filters
                  </button>
                )}

            </div>
          </div>

          {/* ================= PRODUCTS ================= */}

          {loading ? (
            <div className="mt-16 flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-[#0F172A]" />

                <p className="text-sm font-bold text-slate-700">
                  Loading Medical Equipment Catalog...
                </p>
              </div>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="mt-16 text-center rounded-3xl border border-slate-200 bg-white p-16 shadow-lg">

              <Package
                size={48}
                className="mx-auto text-amber-500 mb-4"
              />

              <h3 className="text-2xl font-bold text-[#0F172A]">
                No Instruments Found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try adjusting your search
                keyword or selecting a
                different equipment category.
              </p>

              {(selectedCategory !==
                "All Categories" ||
                searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(
                        "All Categories"
                      );
                      setSearchQuery("");
                    }}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0F172A] text-white px-6 py-3 text-sm font-bold shadow-md hover:bg-[#1E293B]"
                  >
                    Clear Search Filters
                  </button>
                )}

            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id ||
                      product.slug
                    }
                    product={product}
                    makeLink={makeLink}
                  />
                )
              )}

            </div>
          )}

        </div>
      </section>

      {/* ================= BULK PROCUREMENT BANNER ================= */}
      <section className="section-padding bg-white border-t border-slate-200">
        <div className="container-custom">

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 sm:p-12 shadow-2xl text-white">

            <div className="grid lg:grid-cols-12 gap-8 items-center">

              <div className="lg:col-span-8">

                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <ShieldCheck
                    size={16}
                    className="text-amber-400"
                  />
                  Bulk Hospital Orders &
                  Tenders
                </span>

                <h3 className="mt-4 text-3xl font-black text-white">
                  Procuring Equipment for
                  New Hospital Blocks or
                  Diagnostics Chains?
                </h3>

                <p className="mt-3 text-base text-slate-300 leading-relaxed">
                  We offer institutional
                  discounts, customized
                  equipment leasing plans,
                  and complete turnkey lab
                  setup packages with
                  extended AMC warranties.
                </p>

              </div>

              <div className="lg:col-span-4 flex items-center justify-end">

                <a
                  href={makeLink(
                    "/contact"
                  )}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 text-slate-950 px-8 py-4 text-base font-bold shadow-lg transition-all hover:bg-amber-400"
                >
                  <span>
                    Request Bulk Tender Quote
                  </span>

                  <ArrowRight size={18} />
                </a>

              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
}


export default function ProductsPage({
  city,
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-white">

          <div className="flex flex-col items-center gap-3">

            <Loader2 className="h-10 w-10 animate-spin text-[#0F172A]" />

            <p className="text-sm font-bold text-slate-700">
              Loading Medical Equipment
              Catalog...
            </p>

          </div>

        </div>
      }
    >
      <ProductsContent city={city} />
    </Suspense>
  );
}