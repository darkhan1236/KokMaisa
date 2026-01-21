// src/app/components/Header.jsx
import { Leaf, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Навигационные ссылки — берём переводы из JSON
  const navLinks = [
    { label: t('nav.howItWorks'), href: "#how-it-works" },
    { label: t('nav.features'), href: "#features" },
    { label: t('nav.useCases'), href: "#use-cases" }
  ];

  // Функция для плавного скролла к якорю
  const scrollToSection = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // закрываем мобильное меню
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span
              className={`text-2xl font-semibold transition-colors duration-300 ${
                isScrolled ? "text-gray-900" : "text-white"
              }`}
            >
              KokMaisa
            </span>
          </Link>

          {/* Десктопная навигация */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-10">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`text-lg font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled
                    ? "text-gray-700 hover:text-green-600"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Кнопки + переключатель языка (десктоп) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-6">
            <LanguageSwitcher className={isScrolled ? "text-gray-900" : "text-white"} />

            <button
              onClick={() => navigate("/login")}
              className={`px-6 py-2.5 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 ${
                isScrolled
                  ? "text-gray-700 hover:bg-gray-100 "
                  : "text-white hover:bg-white/10 "
              }`}
            >
              {t('nav.login')}
            </button>

            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('nav.register')}
            </button>
          </div>

          {/* Кнопка мобильного меню */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? "text-gray-900 hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden mt-4 py-6 px-4 rounded-2xl shadow-2xl ${
              isScrolled ? "bg-white" : "bg-gray-900/95 backdrop-blur-lg"
            } border border-gray-700/30`}
          >
            <nav className="flex flex-col gap-5 mb-8">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`text-xl py-3 transition-colors font-medium ${
                    isScrolled
                      ? "text-gray-800 hover:text-green-600"
                      : "text-white hover:text-green-300"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-4">
              <div className={isScrolled ? "text-gray-900" : "text-white"}>
                <LanguageSwitcher />
              </div>

              <button
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
                className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                  isScrolled
                    ? "text-gray-700 hover:bg-gray-100 border border-gray-300"
                    : "text-white hover:bg-white/10 border border-white/40"
                }`}
              >
                {t('nav.login')}
              </button>

              <button
                onClick={() => {
                  navigate("/register");
                  setIsMobileMenuOpen(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
              >
                {t('nav.register')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}