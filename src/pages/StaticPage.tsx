import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPageContent, PageSlug, legalPages } from "@/data/legalContent";
import { ChevronRight } from "lucide-react";

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";

  const validSlug = (slug && (slug in legalPages) ? slug : null) as PageSlug | null;

  if (!validSlug) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Back to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const content = getPageContent(validSlug, lang);
  const homeLabel = lang.startsWith("zh") ? "首页" : "Home";
  const updatedLabel = lang.startsWith("zh") ? "最后更新" : "Last updated";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-6 max-w-5xl py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-blue-600">{homeLabel}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{content.title}</span>
          </nav>

          {/* Page Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 tracking-tight">
            {content.title}
          </h1>

          {/* Intro card */}
          {(content.intro || content.updated) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-10">
              {content.updated && (
                <p className="text-sm text-gray-500 mb-3">{updatedLabel}: {content.updated}</p>
              )}
              {content.intro && (
                <p className="text-slate-700 text-[15px] md:text-base leading-[1.85]">
                  {content.intro}
                </p>
              )}
            </div>
          )}

          {/* Sections: heading OUTSIDE, content INSIDE its own card */}
          <div className="space-y-8">
            {content.sections.map((s, i) => (
              <section key={i}>
                {s.heading && (
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                    {s.heading}
                  </h2>
                )}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                  <div className="space-y-4">
                    {s.paragraphs.map((p, j) => (
                      <p key={j} className="text-slate-700 text-[15px] md:text-base leading-[1.85]">
                        {p}
                      </p>
                    ))}
                    {s.list && (
                      <ul className="list-disc list-inside space-y-2 text-slate-700 pl-2">
                        {s.list.map((li, k) => <li key={k}>{li}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
