import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "react-hot-toast";

export const metadata = {
  metadataBase: new URL("https://spinreact.in"),
  title: "Raj Biosis Private Limited | Biomedical & Diagnostic Equipment",
  description:
    "Raj Biosis Private Limited (Raj Biomedical) supplies CBC Machines, Hematology Analyzers, Biochemistry Analyzers, ELISA Readers and laboratory equipment across India.",
  keywords: [
    "Biomedical Equipment Supplier",
    "Laboratory Equipment Supplier",
    "CBC Machine Supplier",
    "Hematology Analyzer Supplier",
    "Biochemistry Analyzer Supplier",
    "Diagnostic Equipment Supplier",
    "Medical Equipment Supplier India",
    "Raj Biosis",
    "Raj Biomedical",
  ],
  openGraph: {
    title: "Raj Biosis Private Limited | Biomedical & Diagnostic Equipment",
    description:
      "Precision medical equipment, automated clinical analyzers, and 24/7 biomedical engineering support across India.",
    url: "https://spinreact.in",
    siteName: "Raj Biosis Private Limited",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Raj Biosis Private Limited",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raj Biosis Private Limited | Biomedical & Diagnostic Equipment",
    description:
      "Precision medical equipment, automated clinical analyzers, and 24/7 biomedical engineering support across India.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: "https://spinreact.in",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F8FAFC] text-slate-900 antialiased selection:bg-[#0F172A] selection:text-white" suppressHydrationWarning>
        <Navbar />

        <main className="min-h-screen">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#0F172A",
                color: "#F8FAFC",
                border: "1px solid #334155",
              },
            }}
          />

          {children}
        </main>

        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}