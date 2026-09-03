import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const wantsAdmin = searchParams.get("admin") === "1";

  useEffect(() => {
    if (query) {
      setSelectedCategory("all");
      const el = document.getElementById("products");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [query]);

  if (wantsAdmin) return <Navigate to="/admin/products" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CategorySection onSelectCategory={setSelectedCategory} />
      <FeaturedProducts
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={query}
      />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;

