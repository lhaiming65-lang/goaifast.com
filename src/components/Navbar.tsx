import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Search, User, ShoppingCart, LogOut, UserCircle, Package, Wallet, CreditCard, Headphones, HelpCircle, Users, Gift, Globe } from "lucide-react";
import { Button } from "./ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthModal from "./AuthModal";
import SearchDropdown from "./SearchDropdown";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === "/") {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [searchParams, location.pathname]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    const target = trimmed ? `/?q=${encodeURIComponent(trimmed)}#products` : "/";
    navigate(target);
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("auth.signOutSuccess"));
    navigate("/");
  };

  const displayName =
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.name ||
    user?.email?.split("@")[0] ||
    "";
  const initial = displayName?.[0]?.toUpperCase() || "U";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-soft transition-transform group-hover:scale-105">
                G
              </div>
              <span className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                GoAifast
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
              <Link to="/" className="px-3 py-2 rounded-md hover:text-primary transition-colors">
                {t("nav.home")}
              </Link>
              <Link to="/page/affiliate" className="px-3 py-2 rounded-md hover:text-primary transition-colors">
                {t("nav.affiliate")}
              </Link>
              <a href="/#products" className="px-3 py-2 rounded-md hover:text-primary transition-colors">
                {t("nav.subscription")}
              </a>
            </nav>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(true);
            }}
            className="hidden md:flex items-center flex-1 max-w-xl mx-8 relative"
          >
            <input
              type="text"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm outline-none"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
            {searchOpen && (
              <SearchDropdown
                query={query}
                onQueryChange={setQuery}
                onSearch={runSearch}
                onClose={() => setSearchOpen(false)}
              />
            )}
          </form>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full gap-2 pl-1 pr-3 hover:bg-secondary"
                  >
                    <div className="w-7 h-7 bg-gradient-brand rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {initial}
                    </div>
                    <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  <DropdownMenuLabel className="font-normal px-2 pt-1 pb-3">
                    <div className="text-sm font-semibold truncate" dir="ltr">{user.email}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t("userMenu.personalInfo")}</div>
                    <div className="mt-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-2 flex items-center justify-between">
                      <span>{t("userMenu.savedThrough")}</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    {t("userMenu.personalInfo")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Wallet className="w-4 h-4 mr-2" />
                    {t("userMenu.credits")} <span className="ml-auto text-xs text-muted-foreground">$0.00</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t("userMenu.mySubscription")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/page/contact-us")}>
                    <Headphones className="w-4 h-4 mr-2" />
                    {t("userMenu.support")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/page/help-center")}>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    {t("userMenu.helpCenter")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="w-4 h-4 mr-2" />
                    {t("userMenu.orderHistory")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/page/affiliate")}>
                    <Users className="w-4 h-4 mr-2" />
                    {t("userMenu.affiliateProgram")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/page/refer-earn")}>

                    <Gift className="w-4 h-4 mr-2" />
                    {t("userMenu.referAndEarn")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Globe className="w-4 h-4 mr-2" />
                    {t("userMenu.changeLanguage")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("userMenu.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => openAuth("signin")}
                  className="rounded-full hidden sm:inline-flex"
                >
                  {t("auth.signIn")}
                </Button>
                <Button
                  onClick={() => openAuth("signup")}
                  className="rounded-full gap-2 bg-gradient-brand hover:opacity-90 transition-opacity"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("auth.signUp")}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
    </>
  );
}
