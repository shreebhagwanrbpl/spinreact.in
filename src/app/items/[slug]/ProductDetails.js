"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { fallbackProducts, makeSlug } from "@/data/productsData";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";
import { Microscope } from "lucide-react";

import {
    FaPlay,
    FaShareAlt,
    FaWhatsapp,
    FaFacebook,
    FaInstagram,
    FaLink,
} from "react-icons/fa";

import {
    doc,
    getDoc,
    addDoc,
    collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const loadImageBase64 = async (src) => {
    try {
        if (!src || typeof src !== "string") {
            throw new Error("Invalid image source");
        }

        if (!src.startsWith("http")) {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    try {
                        resolve(canvas.toDataURL("image/png"));
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = (e) => reject(e);
                img.src = src;
            });
        }

        // Method 1: Fetch via local proxy (bypasses CORS securely)
        try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (proxyErr) {
            console.warn("Proxy method failed, falling back to direct fetch...", proxyErr);
        }

        // Method 2: Direct fetch fallback
        try {
            const response = await fetch(src, { cache: "no-cache" });
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (fetchErr) {
            console.warn("fetch method failed, falling back to canvas method...", fetchErr);
        }

        // Method 3: Fallback to HTML Image element
        return await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL("image/png"));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(new Error("Image element load failed"));
            img.src = src;
        });
    } catch (err) {
        console.error("loadImageBase64 failed for src:", src, err);
        throw err;
    }
};

const getProductSpecs = (product) => {
    const specsMap = new Map();

    const standardFields = [
        ["Brand", "brand"],
        ["Model", "model"],
        ["Instrument", "instrument"],
        ["Category", "category"],
        ["Capacity", "capacity"],
        ["Throughput", "throughput"],
        ["Usage", "usage"],
        ["Automation", "automation"],
        ["Availability", "availability"]
    ];

    standardFields.forEach(([label, key]) => {
        const val = product[key];
        if (val && String(val).trim() && String(val).trim() !== "N/A") {
            specsMap.set(label, String(val).trim());
        }
    });

    const blacklist = new Set([
        "title", "desc", "description", "image", "images", "slug",
        "uid", "video", "pdf", "isPublished", "category", "subCategory",
        "brand", "model", "instrument", "capacity", "throughput",
        "usage", "automation", "availability",
        "price", "categoryProductId", "category_product_id", "categoryproductid",
        "id", "createdAt", "created_at", "createdat"
    ]);

    if (product.parameters && typeof product.parameters === "string") {
        const parts = product.parameters.split("|");
        parts.forEach((part) => {
            const colonIndex = part.indexOf(":");
            if (colonIndex !== -1) {
                const label = part.substring(0, colonIndex).trim();
                const value = part.substring(colonIndex + 1).trim();
                const lowerLabel = label.toLowerCase();
                if (
                    label &&
                    value &&
                    value !== "N/A" &&
                    !blacklist.has(lowerLabel) &&
                    !lowerLabel.includes("price") &&
                    !lowerLabel.includes("id")
                ) {
                    const cleanLabel = label.replace(/\b\w/g, (c) => c.toUpperCase());
                    specsMap.set(cleanLabel, value);
                }
            }
        });
    }

    if (product.specs && typeof product.specs === "object") {
        if (Array.isArray(product.specs)) {
            product.specs.forEach((item) => {
                if (item && item.label && item.value && String(item.value).trim() !== "N/A") {
                    specsMap.set(item.label, String(item.value).trim());
                }
            });
        } else {
            Object.entries(product.specs).forEach(([k, v]) => {
                if (v && String(v).trim() && String(v).trim() !== "N/A") {
                    const label = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
                    specsMap.set(label, String(v).trim());
                }
            });
        }
    }

    return Array.from(specsMap.entries());
};

const getWebsiteDomain = () => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
            return host;
        }
    }
    return "spinreact.in";
};

export default function ProductDetails({ slug }) {
    const [product, setProduct] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedMedia, setSelectedMedia] = useState("image");
    const [showShare, setShowShare] = useState(false);
    const [contactInfo, setContactInfo] = useState([]);
    const [downloadingBrochure, setDownloadingBrochure] = useState(false);

    const shareRef = useRef();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const pathname = usePathname();

    const specificationsList = useMemo(() => {
        if (!product) return [];
        const list = [];
        const added = new Set();

        const addSpec = (label, val) => {
            if (val === null || val === undefined || typeof val === "object") return;
            const strVal = String(val).trim();
            if (!strVal || strVal === "N/A" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "undefined") return;
            const keyLower = label.toLowerCase().trim();
            if (!added.has(keyLower)) {
                added.add(keyLower);
                list.push({ label, value: strVal });
            }
        };

        // Standard dynamic admin fields
        if (product.brand) addSpec("Brand", product.brand);
        if (product.model) addSpec("Model", product.model);
        if (product.instrument) addSpec("Instrument", product.instrument);
        if (product.capacity) addSpec("Capacity", product.capacity);
        if (product.throughput) addSpec("Throughput", product.throughput);
        if (product.usage) addSpec("Usage / Application", product.usage);
        if (product.automation) addSpec("Automation", product.automation);
        if (product.size) addSpec("Size / Dimensions", product.size);
        if (product.availability || product.status) addSpec("Availability", product.availability || product.status);
        if (product.category) addSpec("Category", product.category);
        if (product.subCategory) addSpec("Sub Category", product.subCategory);
        if (product.categoryProductId) addSpec("Product ID", product.categoryProductId);

        // Parse parameters string if given in admin
        if (product.parameters && typeof product.parameters === "string") {
            if (product.parameters.includes("|") || product.parameters.includes(":")) {
                const parts = product.parameters.split("|");
                parts.forEach((part) => {
                    const colonIndex = part.indexOf(":");
                    if (colonIndex !== -1) {
                        const lbl = part.substring(0, colonIndex).trim();
                        const val = part.substring(colonIndex + 1).trim();
                        if (lbl && val) {
                            addSpec(lbl.replace(/\b\w/g, (c) => c.toUpperCase()), val);
                        }
                    } else if (part.trim()) {
                        addSpec("Parameters", part.trim());
                    }
                });
            } else {
                addSpec("Parameters", product.parameters);
            }
        }

        // Parse custom specs object if provided
        if (product.specs && typeof product.specs === "object") {
            if (Array.isArray(product.specs)) {
                product.specs.forEach((item) => {
                    if (item && item.label && item.value) {
                        addSpec(item.label, item.value);
                    } else if (typeof item === "string" && item.includes(":")) {
                        const [k, v] = item.split(":");
                        addSpec(k.trim(), v.trim());
                    }
                });
            } else {
                Object.entries(product.specs).forEach(([k, v]) => {
                    if (v && typeof v !== "object") {
                        const cleanLabel = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
                        addSpec(cleanLabel, v);
                    }
                });
            }
        }

        return list;
    }, [product]);

    const pathParts = pathname
        .split("/")
        .filter(Boolean);

    const city =
        pathParts.length > 1
            ? pathParts[0]
            : "India";

    const cityName =
        city.charAt(0).toUpperCase() +
        city.slice(1);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const allProducts = await fetchAllDynamicProducts();

                let found = allProducts.find(
                    (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
                );

                if (!found) {
                    found = fallbackProducts.find(
                        (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
                    );
                }

                if (!found && fallbackProducts.length > 0) {
                    const prettyTitle = slug
                        ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "Biomedical Equipment";
                    found = {
                        ...fallbackProducts[0],
                        title: prettyTitle,
                        slug: slug || "biomedical-equipment",
                    };
                }

                setProduct(found);

                if (found) {
                    const mainImg =
                        (Array.isArray(found.images) && found.images[0]) ||
                        found.image ||
                        found.imgUrl ||
                        found.imageUrl ||
                        "/logo.png";
                    setSelectedImage(mainImg);
                    setSelectedMedia("image");
                }
            } catch (error) {
                console.error("Error loading product:", error);
                let found = fallbackProducts.find(
                    (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
                );
                if (!found && fallbackProducts.length > 0) {
                    const prettyTitle = slug
                        ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : "Biomedical Equipment";
                    found = {
                        ...fallbackProducts[0],
                        title: prettyTitle,
                        slug: slug || "biomedical-equipment",
                    };
                }
                setProduct(found);
                if (found) {
                    const mainImg =
                        (Array.isArray(found.images) && found.images[0]) ||
                        found.image ||
                        found.imgUrl ||
                        found.imageUrl ||
                        "/logo.png";
                    setSelectedImage(mainImg);
                    setSelectedMedia("image");
                }
            }
        };

        loadProduct();
    }, [slug]);

    useEffect(() => {
        const loadContact = async () => {
            try {
                const snap = await getDoc(
                    doc(db, "websites", "spinreactin", "pages", "contact")
                );
                if (snap.exists()) {
                    setContactInfo(snap.data().contactInfo || []);
                }
            } catch (err) {
                console.error("Error loading contact info:", err);
            }
        };
        loadContact();
    }, []);

    const handleDownloadBrochure = async () => {
        if (!product) return;
        try {
            setDownloadingBrochure(true);
            const { jsPDF } = await import("jspdf");
            const pdfDoc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Load logo
            let logoBase64 = null;
            try {
                logoBase64 = await loadImageBase64("/logo.png");
            } catch (e) {
                console.error("Error loading brochure logo:", e);
            }

            // Load product image
            const imgUrl =
                product.image ||
                product.imageUrl ||
                product.imgUrl ||
                (product.images && product.images[0]);
            let productImgBase64 = null;
            if (imgUrl && imgUrl !== "/logo.png") {
                try {
                    productImgBase64 = await loadImageBase64(imgUrl);
                } catch (e) {
                    console.error("Error loading product image:", e);
                }
            }

            // Layout Dimensions
            const margin = 15;
            const pageWidth = 210;
            const pageHeight = 297;
            const contentWidth = pageWidth - 2 * margin;

            // Palette
            const colorPrimary = [245, 158, 11];     // Amber #F59E0B
            const colorDark = [15, 23, 42];          // Deep Navy #0F172A
            const colorGray = [100, 116, 139];       // Slate-500
            const colorLightBorder = [226, 232, 240];// Slate-200
            const colorBgWarm = [248, 250, 252];     // Slate-50

            // 1. HEADER
            let headerLeftOffset = margin;
            if (logoBase64) {
                try {
                    pdfDoc.addImage(logoBase64, "PNG", margin, 14, 14, 14);
                    headerLeftOffset += 18;
                } catch (imgErr) {
                    console.warn("Could not render logo in PDF:", imgErr);
                }
            }

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(16);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            pdfDoc.text("Raj Biosis Private Limited", headerLeftOffset, 20);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text("Biomedical & Diagnostic Equipment Supplier", headerLeftOffset, 25);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

            const websiteText = getWebsiteDomain();

            const phoneItems = contactInfo.filter((item) => {
                const l = (item?.label || "").toLowerCase();
                return l.includes("phone") || l.includes("mobile") || l.includes("tel") || l.includes("contact");
            });
            const rawPhones = phoneItems.flatMap((i) => (Array.isArray(i.value) ? i.value : [i.value])).filter(Boolean);
            const phoneString = rawPhones.length > 0 ? rawPhones.slice(0, 2).join(", ") : "+91 8318368383, +91 9983123469";

            const emailItem = contactInfo.find((item) => {
                const l = (item?.label || "").toLowerCase();
                return l.includes("email") || l.includes("mail");
            });
            const emailText = emailItem
                ? Array.isArray(emailItem.value)
                    ? emailItem.value[0]
                    : emailItem.value
                : "mail@rajbiosis.com";

            pdfDoc.text(`Website: ${websiteText}`, 135, 19);
            pdfDoc.text(`Email: ${emailText}`, 135, 24);
            pdfDoc.text(`Phone: ${phoneString}`, 135, 29);

            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, 34, pageWidth - margin, 34);

            // 2. PRODUCT TITLE & CATEGORY BADGE
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.text((product.category || "BIOMEDICAL EQUIPMENT").toUpperCase(), margin, 42);

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(15);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            const titleLines = pdfDoc.splitTextToSize(product.title, contentWidth);
            pdfDoc.text(titleLines, margin, 48);
            const titleHeight = titleLines.length * 6.5;

            // 3. PRODUCT IMAGE
            const imageY = 48 + titleHeight + 3;
            const imageHeight = 50;
            const imageWidth = 65;
            const imageX = margin + (contentWidth - imageWidth) / 2;

            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
            pdfDoc.roundedRect(imageX - 6, imageY - 2, imageWidth + 12, imageHeight + 4, 3, 3, "FD");

            if (productImgBase64) {
                let format = "JPEG";
                if (productImgBase64.startsWith("data:image/png")) {
                    format = "PNG";
                }
                try {
                    pdfDoc.addImage(productImgBase64, format, imageX, imageY, imageWidth, imageHeight);
                } catch (imgAddErr) {
                    console.warn("PDF product image render failed:", imgAddErr);
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(9);
                    pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                    pdfDoc.text("Diagnostic Specification Sheet", imageX + 8, imageY + imageHeight / 2);
                }
            } else {
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(9.5);
                pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                pdfDoc.text("Certified Medical Equipment", imageX + 7, imageY + imageHeight / 2);
            }

            // 4. PRODUCT OVERVIEW
            const descY = imageY + imageHeight + 9;
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            pdfDoc.text("Product Overview", margin, descY);

            pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, descY + 2, margin + 28, descY + 2);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);

            let descText = product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy.";
            if (descText.length > 350) {
                descText = descText.substring(0, 350) + "...";
            }
            const descLines = pdfDoc.splitTextToSize(descText, contentWidth);
            pdfDoc.text(descLines, margin, descY + 8);
            const descHeight = descLines.length * 4.2;

            // 5. SPECIFICATIONS
            const specsY = descY + 11 + descHeight;
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            pdfDoc.text("Technical Specifications", margin, specsY);

            pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, specsY + 2, margin + 38, specsY + 2);

            const specs = getProductSpecs(product);

            let specRowY = specsY + 8;
            pdfDoc.setFontSize(8);

            for (let i = 0; i < specs.length; i++) {
                const label = specs[i][0];
                const value = String(specs[i][1]);

                // Zebra row background
                if (i % 2 === 0) {
                    pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
                    pdfDoc.rect(margin, specRowY - 3.5, contentWidth, 5, "F");
                }

                // Print Label
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
                pdfDoc.text(`${label}:`, margin + 2, specRowY);

                // Print Value
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                const valueLines = pdfDoc.splitTextToSize(value, contentWidth - 45);
                pdfDoc.text(valueLines, margin + 42, specRowY);

                specRowY += Math.max(valueLines.length * 3.8, 5);

                if (specRowY > pageHeight - 22) {
                    pdfDoc.addPage();
                    specRowY = margin + 10;
                }
            }

            // 6. FOOTER
            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.4);
            pdfDoc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

            pdfDoc.setFont("helvetica", "italic");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text(
                "Raj Biosis Private Limited | NABL-Traceable Calibration • 24/7 SLA Engineering Support",
                pageWidth / 2,
                pageHeight - 9,
                { align: "center" }
            );

            pdfDoc.save(`${product.title.replace(/\s+/g, "_")}_Brochure.pdf`);
            toast.success("Brochure downloaded successfully!");
        } catch (e) {
            console.error("Error creating PDF brochure:", e);
            toast.error("Failed to generate brochure PDF.");
        } finally {
            setDownloadingBrochure(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.name.trim()) {
            return toast.error("Name is required");
        }

        if (!emailRegex.test(form.email)) {
            return toast.error("Enter valid email");
        }

        if (!phoneRegex.test(form.phone)) {
            return toast.error("Enter valid mobile number");
        }

        try {
            setSubmitting(true);

            await addDoc(
                collection(
                    db,
                    "websitesQueries",
                    "spinreactin",
                    "productQueries"
                ),
                {
                    ...form,
                    productName: product.title,
                    productSlug: product.slug,
                    brand: product.brand || "",
                    model: product.model || "",
                    createdAt: new Date(),
                }
            );

            toast.success("Your enquiry has been submitted successfully.");

            setForm({
                name: "",
                email: "",
                phone: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const productSchema = product
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: product.image ? [product.image] : [],
            description:
                product.desc ||
                product.description ||
                product.title,
            brand: {
                "@type": "Brand",
                name: product.brand || "Raj Biosis Private Limited",
            },
        }
        : null;

    const faqSchema = product
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: `What is ${product.title} used for?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: `${product.title} is used in hospitals, pathology labs and diagnostic centres.`,
                    },
                },
                {
                    "@type": "Question",
                    name: "Do you provide installation support?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes, installation and technical support are available.",
                    },
                },
            ],
        }
        : null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link Copied");
        setShowShare(false);
    };

    const handleWhatsapp = () => {
        const shareText = `🔬 ${product?.title}\n\n${product?.desc}\n\n🌐 ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    };

    const handleFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const handleInstagram = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied for Instagram.");
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.title,
                text: product.desc,
                url: window.location.href,
            });
        } else {
            setShowShare(!showShare);
        }
    };

    useEffect(() => {
        const close = (e) => {
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShowShare(false);
            }
        };

        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    if (!product) {
        return (
            <section className="py-10 md:py-20 bg-white">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="h-[420px] md:h-[520px] rounded-[36px] bg-slate-100 animate-pulse border border-slate-200" />
                        <div>
                            <div className="h-12 w-3/4 bg-slate-100 rounded-xl animate-pulse mb-8 border border-slate-200" />
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-6 bg-slate-100 rounded-lg animate-pulse mb-4 border border-slate-200" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 md:py-12 bg-white text-slate-900 selection:bg-[#0F172A] selection:text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(faqSchema),
                }}
            />

            <div className="container-custom">
                {/* Breadcrumb */}
                <div className="mb-6 text-xs sm:text-sm text-slate-500">
                    <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <Link href="/items" className="hover:text-amber-600 transition-colors">Products</Link>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-[#0F172A] font-bold">{product.title}</span>
                </div>

                {/* Main Unified 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* LEFT SCROLLABLE CONTENT COLUMN */}
                    <div className="lg:col-span-7 xl:col-span-7 space-y-8">
                        {/* Product Image & Media Box */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
                            <div className="relative h-[320px] sm:h-[400px] md:h-[460px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                {/* Premium Quality Badge */}
                                <div className="absolute left-4 top-4 z-20 rounded-full bg-[#0F172A] px-3.5 py-1 text-xs font-bold text-white shadow-md border border-slate-800">
                                    Premium Diagnostic Quality
                                </div>

                                {selectedMedia === "video" && product.video ? (
                                    <video
                                        controls
                                        autoPlay
                                        className="h-full w-full object-contain p-4"
                                    >
                                        <source src={product.video} type="video/mp4" />
                                    </video>
                                ) : (
                                    <>
                                        {!imageLoaded && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
                                                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-md border border-slate-200">
                                                    <Microscope size={32} className="animate-bounce text-amber-500" />
                                                </div>
                                            </div>
                                        )}

                                        {(selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) && (selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) !== "/logo.png" ? (
                                            <Image
                                                src={selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])}
                                                alt={product.title || "Product"}
                                                fill
                                                priority
                                                onLoad={() => setImageLoaded(true)}
                                                className="object-contain p-4 transition-all duration-500 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-amber-500 shadow-md">
                                                    <Microscope size={38} />
                                                </div>
                                                <span className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-800">
                                                    {product.category || "Biomedical Analyzer"}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Thumbnails Row */}
                            <div className="mt-4 flex flex-wrap gap-3">
                                {((Array.isArray(product.images) && product.images.length > 0)
                                    ? product.images
                                    : [product.image || product.imgUrl || product.imageUrl || selectedImage]
                                ).filter((img) => img && img !== "/logo.png").map((img, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(img);
                                            setSelectedMedia("image");
                                        }}
                                        className={`group relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-white cursor-pointer ${selectedMedia === "image" && selectedImage === img
                                            ? "border-[#0F172A] shadow-md shadow-slate-900/10"
                                            : "border-slate-200 hover:border-[#0F172A]"
                                            }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`Thumbnail ${index + 1}`}
                                            width={80}
                                            height={80}
                                            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </button>
                                ))}

                                {product.video && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMedia("video")}
                                        className={`group flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${selectedMedia === "video"
                                            ? "border-[#0F172A] bg-[#0F172A] text-white shadow-md shadow-slate-900/15"
                                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0F172A]"
                                            }`}
                                    >
                                        <FaPlay size={18} className={selectedMedia === "video" ? "text-white" : "text-[#0F172A]"} />
                                        <span className="mt-1 text-[11px] font-bold">Video</span>
                                    </button>
                                )}

                                {product.pdf && (
                                    <a
                                        href={product.pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F172A] hover:shadow-md cursor-pointer"
                                    >
                                        <span className="text-xl">📄</span>
                                        <span className="mt-1 text-[11px] font-bold text-slate-700">PDF</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Title, Category & Action Buttons */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                                        {product.subCategory && product.subCategory !== product.category
                                            ? `${product.category} • ${product.subCategory}`
                                            : product.category || "Biomedical Equipment"}
                                    </span>

                                    <h1 className="mt-3 text-2xl font-black leading-tight text-[#0F172A] sm:text-3xl md:text-4xl">
                                        {product.title}
                                    </h1>
                                </div>

                                {/* Share Button & Popover */}
                                <div ref={shareRef} className="relative flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleNativeShare}
                                        className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-300 hover:border-[#0F172A] hover:text-[#0F172A] cursor-pointer"
                                        aria-label="Share Product"
                                    >
                                        <FaShareAlt size={16} className="transition-transform duration-300 group-hover:rotate-12" />
                                    </button>

                                    {showShare && (
                                        <div className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100 hover:text-[#0F172A]"
                                            >
                                                <FaLink className="text-[#0F172A]" />
                                                <span>Copy Link</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleWhatsapp}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100 hover:text-[#0F172A]"
                                            >
                                                <FaWhatsapp className="text-emerald-500" />
                                                <span>WhatsApp</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleFacebook}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100 hover:text-[#0F172A]"
                                            >
                                                <FaFacebook className="text-blue-500" />
                                                <span>Facebook</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleInstagram}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100 hover:text-[#0F172A]"
                                            >
                                                <FaInstagram className="text-pink-500" />
                                                <span>Instagram</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Download Spec Brochure Button */}
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleDownloadBrochure}
                                    disabled={downloadingBrochure}
                                    className="group inline-flex items-center gap-2.5 rounded-2xl bg-[#0F172A] text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-slate-900/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1E293B] disabled:opacity-75 cursor-pointer"
                                >
                                    {downloadingBrochure ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Generating Brochure...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Download Spec Brochure</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Product Overview & Description */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
                            <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-700">
                                Product Overview
                            </span>

                            <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#0F172A]">
                                Description & Clinical Application
                            </h3>

                            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-700">
                                {product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy, robust laboratory throughput, and strict quality compliance."}
                            </p>
                        </div>

                        {/* Product Specifications (Rendered ONCE clearly) */}
                        {specificationsList.length > 0 && (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
                                <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-700">
                                    Technical Data
                                </span>

                                <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#0F172A]">
                                    Product Specifications
                                </h3>

                                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full border-collapse">
                                        <tbody>
                                            {specificationsList.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50"
                                                >
                                                    <td className="w-1/3 bg-slate-50/80 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-amber-700 border-r border-slate-100">
                                                        {item.label}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm font-semibold text-[#0F172A]">
                                                        {item.value}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* FAQs / Diagnostic Knowledge */}
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
                            <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-700">
                                Diagnostic Support
                            </span>

                            <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#0F172A]">
                                Frequently Asked Questions
                            </h3>

                            <div className="mt-6 space-y-4">
                                {[
                                    {
                                        question: `What is ${product.title} used for in ${cityName}?`,
                                        answer: `${product.title} is commonly used in hospitals, pathology laboratories, diagnostic centres and healthcare facilities for accurate diagnostic testing.`,
                                    },
                                    {
                                        question: `What is the price of ${product.title} in ${cityName}?`,
                                        answer: `Pricing is customized based on throughput requirements, optional modules, and warranty terms. Contact our sales team for an official quotation.`,
                                    },
                                    {
                                        question: "Do you provide installation and NABL calibration support?",
                                        answer: `Yes. Every installation is performed by certified biomedical engineers with complete IQ/OQ/PQ validation and NABL-traceable reference calibration.`,
                                    },
                                    {
                                        question: "Do you deliver and service instruments nationwide across India?",
                                        answer: `Yes. We provide temperature-monitored reagent logistics, safe courier dispatch, and 24/7 emergency engineer maintenance across India.`,
                                    },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 transition-all duration-300 hover:border-amber-500/40"
                                    >
                                        <h4 className="text-sm sm:text-base font-bold text-[#0F172A]">
                                            {item.question}
                                        </h4>
                                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                                            {item.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT STICKY QUERY FORM COLUMN */}
                    <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24">
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
                            <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-700">
                                Direct Quote Request
                            </span>

                            <h2 className="mt-3 text-2xl font-black text-[#0F172A] sm:text-3xl">
                                Request Official Pricing
                            </h2>

                            <p className="mt-2 text-xs sm:text-sm text-slate-600">
                                Inquiring for: <strong className="text-amber-600 font-bold">{product.title}</strong>
                            </p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Dr. John Doe / Lab Name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all placeholder:text-slate-400 focus:border-[#0F172A] focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                                        Official Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="doctor@hospital.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all placeholder:text-slate-400 focus:border-[#0F172A] focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                                        Mobile / WhatsApp Number *
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="10-digit Mobile Number"
                                        maxLength={10}
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all placeholder:text-slate-400 focus:border-[#0F172A] focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] py-4 font-bold text-white shadow-xl transition-all duration-300 disabled:opacity-70 cursor-pointer mt-2"
                                >
                                    {submitting ? "Submitting Inquiry..." : "Get Price & Spec Sheet"}
                                </button>
                            </form>

                            {/* Trust Guarantee Note */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-amber-500 font-bold">🔒</span>
                                <span>Official OEM price & spec sheet delivered within 2 hours.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}