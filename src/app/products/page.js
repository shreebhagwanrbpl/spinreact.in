"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  BadgeCheck,
  PackageCheck,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [openedCategory, setOpenedCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      const fetched = await fetchAllDynamicProducts();
      setProducts(fetched);
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const text = `${item.title} ${item.brand} ${item.category}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [products, search]);

  const groupedProducts = useMemo(() => {
    const obj = {};
    filteredProducts.forEach((item) => {
      const cat = item.category || "General Equipment";
      if (!obj[cat]) {
        obj[cat] = [];
      }
      obj[cat].push(item);
    });
    return obj;
  }, [filteredProducts]);

  const categories = Object.keys(groupedProducts);

  const toggleCategory = (category) => {
    if (openedCategory === category) {
      setOpenedCategory("");
      return;
    }
    setOpenedCategory(category);
  };

  const scrollToProduct = (slug, category) => {
    setOpenedCategory(category);
    setActiveCategory(category);
    setTimeout(() => {
      const el = document.getElementById(slug);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);
  };

  return (
    <div className="bg-white text-slate-900 selection:bg-[#0F172A] selection:text-white">
      <PageBanner
        badge="Product Directory"
        title="Our Products"
        subtitle="Explore advanced biomedical and diagnostic equipment designed for modern healthcare excellence."
      />

      <section className="py-20 bg-slate-50">
        <div className="container-custom">
          <SectionTitle
            badge="Featured Products"
            title="Premium Biomedical Equipment"
            description="Explore our comprehensive range of high-quality biomedical and diagnostic equipment designed to deliver precision, reliability, and advanced healthcare solutions."
            center
          />

          <div className="grid lg:grid-cols-[320px_1fr] gap-10 mt-16">
            {/* LEFT SIDEBAR */}
            <aside className="sticky top-28 h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-6">
                <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                  Browse
                </span>
                <h2 className="mt-4 text-2xl font-black text-[#0F172A]">Categories</h2>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-10 text-sm text-[#0F172A] outline-none transition-all placeholder:text-slate-400 focus:border-[#0F172A] focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Categories */}
              <div className="mt-6 space-y-3">
                {categories.map((category) => (
                  <div key={category} className="overflow-hidden rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`flex w-full items-center justify-between px-5 py-4 font-medium transition-all duration-300 ${activeCategory === category
                        ? "bg-[#0F172A] text-white font-bold shadow-md"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span className="flex items-center gap-3 text-sm">
                        {openedCategory === category ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        {category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${activeCategory === category
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {groupedProducts[category].length}
                      </span>
                    </button>

                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight:
                          openedCategory === category
                            ? groupedProducts[category].length * 48 + "px"
                            : "0px",
                      }}
                    >
                      {groupedProducts[category].map((item) => (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => scrollToProduct(item.slug, category)}
                          className="block w-full border-t border-slate-100 bg-slate-50 px-6 py-3 text-left text-xs font-medium text-slate-600 transition hover:bg-white hover:text-amber-600 truncate"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT SIDE LIST */}
            <div className="space-y-16">
              {Object.entries(groupedProducts).map(([category, list]) => (
                <section key={category} id={category.replace(/\s+/g, "-").toLowerCase()}>
                  <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-5">
                    <div>
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-4 py-1 text-xs font-bold text-amber-800 uppercase">
                        Category
                      </span>
                      <h2 className="mt-3 text-3xl font-black text-[#0F172A]">{category}</h2>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[#0F172A] font-bold text-xs shadow-sm">
                      {list.length} Products
                    </div>
                  </div>

                  <div className="space-y-8">
                    {list.map((product) => (
                      <div
                        key={product.slug}
                        id={product.slug}
                        className="group rounded-[30px] border border-slate-200 bg-white p-7 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:shadow-2xl"
                      >
                        <div className="grid items-center gap-8 lg:grid-cols-[220px_1fr_190px]">
                          {/* Image */}
                          <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4">
                            <Image
                              src={product.image || "/logo.png"}
                              alt={product.title}
                              width={200}
                              height={200}
                              className="max-h-[160px] object-contain transition duration-300 group-hover:scale-105"
                            />
                          </div>

                          {/* Content */}
                          <div>
                            <h3 className="text-2xl font-black text-[#0F172A] group-hover:text-amber-600 transition-colors">
                              {product.title}
                            </h3>
                            <p className="mt-3 leading-relaxed text-slate-600 text-sm line-clamp-2">
                              {product.description || product.desc}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              {product.brand && (
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                    Brand
                                  </p>
                                  <p className="mt-0.5 font-bold text-[#0F172A] text-xs truncate">
                                    {product.brand}
                                  </p>
                                </div>
                              )}
                              {product.model && (
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                    Model
                                  </p>
                                  <p className="mt-0.5 font-bold text-[#0F172A] text-xs truncate">
                                    {product.model}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Button */}
                          <div className="flex justify-center lg:justify-end">
                            <Link href={`/items/${product.slug}`} className="w-full lg:w-auto">
                              <button className="w-full rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3.5 font-bold text-white transition-all shadow-md lg:w-auto text-sm">
                                View Details →
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="container-custom">
          <SectionTitle
            badge="Why Choose Our Products"
            title="Trusted Quality & Innovation"
            description="Every biomedical product is engineered with precision, tested for quality, and backed by reliable support to ensure exceptional performance in hospitals and laboratories."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck size={30} />,
                title: "Certified Quality",
                desc: "Every product undergoes strict quality testing to ensure safety, durability and reliable performance.",
              },
              {
                icon: <Truck size={30} />,
                title: "Fast Delivery",
                desc: "Quick and secure delivery across India with safe packaging and timely logistics support.",
              },
              {
                icon: <BadgeCheck size={30} />,
                title: "Trusted Support",
                desc: "Dedicated technical assistance and after-sales service whenever you need expert guidance.",
              },
              {
                icon: <PackageCheck size={30} />,
                title: "Premium Equipment",
                desc: "Advanced biomedical equipment designed for modern laboratories, hospitals and healthcare professionals.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-500 hover:shadow-2xl"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-amber-500 border border-slate-200 shadow-sm transition-all duration-300 group-hover:bg-[#0F172A] group-hover:text-amber-400">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black text-[#0F172A]">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}