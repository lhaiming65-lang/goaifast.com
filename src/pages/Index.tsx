import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  useEffect(() => {
    if (query) {
      setSelectedCategory("all");
      const el = document.getElementById("products");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [query]);

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

