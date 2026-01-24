// src/app/components/Header.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

import {
  Leaf, Menu, X, User, LogOut, LandPlot,
  ChevronDown, Plane, BarChart3, MessageSquareText,
  Settings, Wheat, Map,
} from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const userMenuRef = useRef(null);

  const isHomePage = location.pathname === "/";
  const navLinks = isHomePage ? [
    { label: t('nav.howItWorks'), href: "#how-it-works" },
    { label: t('nav.features'), href: "#features" },
    { label: t('nav.useCases'), href: "#use-cases" },
  ] : [];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const getProfilePath = () => {
    if (!user) return "/login";
    if (user.account_type === "farmer") return "/profile/farmer";
    if (user.account_type === "agronomist") return "/profile/agronomist";
    return "/profile";
  };

  // Определяем, является ли пользователь агрономом
  const isAgronomist = user?.account_type === "agronomist";

  // Меню пользователя — адаптируем под тип аккаунта
  const userMenuItems = [
    { label: t('nav.profile'), icon: User, href: getProfilePath(), color: "text-primary" },

    // Фермы
    {
      label: isAgronomist ? t('nav.assignedFarms') : t('nav.myFarms'),
      icon: LandPlot,
      href: "/farms",
      color: "text-primary"
    },

    // Пастбища
    {
      label: isAgronomist ? t('nav.assignedPastures') : t('nav.myPastures'),
      icon: Wheat,
      href: isAgronomist ? "/pastures-analysis" : "/pastures",
      color: "text-primary"
    },

    // Дроны — только для фермера
    ...(!isAgronomist ? [{
      label: t('nav.myDrones'),
      icon: Plane,
      href: "/drones",
      color: "text-primary"
    }] : []),

    { type: "divider" },

    { label: t('nav.biomassDashboard'), icon: BarChart3, href: "/biomass-dashboard", color: "text-amber-600" },
    { label: t('nav.pastureMap'), icon: Map, href: "/pastures-map", color: "text-amber-600" },

    { type: "divider" },

    { label: t('nav.aiConsultant'), icon: MessageSquareText, href: "/ai-chat", color: "text-blue-600" },
    { label: t('nav.settings'), icon: Settings, href: "/settings", color: "text-muted-foreground" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg text-gray-900"
          : "bg-transparent text-white"
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

          {/* Десктоп навигация — ТОЛЬКО на главной */}
          {isHomePage && (
            <nav className="hidden md:flex items-center gap-8 lg:gap-10">
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
          )}

          {/* Десктоп правый блок */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <LanguageSwitcher className={isScrolled ? "text-gray-900" : "text-white"} />

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
                    isScrolled
                      ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                      : "text-white hover:bg-white/10 border border-white/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium max-w-32 truncate">
                    {user.full_name || user.email?.split("@")[0] || t('common.user')}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">
                        {user.full_name || t('common.user')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {user.account_type === "farmer" ? t('roles.farmer') : t('roles.agronomist')}
                      </span>
                    </div>

                    <div className="py-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {userMenuItems.map((item, index) =>
                        item.type === "divider" ? (
                          <div key={index} className="border-t border-gray-200 my-2" />
                        ) : (
                          <Link
                            key={index}
                            to={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span>{item.label}</span>
                          </Link>
                        )
                      )}

                      <div className="border-t border-gray-200 my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className={`px-6 py-2.5 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 ${
                    isScrolled ? "text-gray-700 hover:bg-gray-100 border border-gray-200" : "text-white hover:bg-white/10 border border-white/30"
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
              </>
            )}
          </div>

          {/* Мобильная кнопка */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? "text-gray-900 hover:bg-gray-100" : "text-white hover:bg-white/10"
            }`}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden mt-4 mx-4 py-6 px-4 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto ${
            isScrolled ? "bg-white" : "bg-gray-900/95 backdrop-blur-lg"
          } border border-gray-200`}
        >
          {/* Навигация — ТОЛЬКО на главной */}
          {isHomePage && (
            <nav className="flex flex-col gap-5 mb-8">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`text-xl py-3 transition-colors font-medium ${
                    isScrolled ? "text-gray-800 hover:text-green-600" : "text-white hover:text-green-300"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <div className="flex flex-col gap-4">
            <LanguageSwitcher className={isScrolled ? "text-gray-900" : "text-white"} />

            {user ? (
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
                <div className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{user.full_name || t('common.user')}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                {userMenuItems.map((item, index) =>
                  item.type === "divider" ? (
                    <div key={index} className="border-t border-gray-200 my-1" />
                  ) : (
                    <Link
                      key={index}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                >
                  <LogOut className="w-6 h-6" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}
                  className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                    isScrolled ? "text-gray-700 hover:bg-gray-100 border border-gray-300" : "text-white hover:bg-white/10 border border-white/40"
                  }`}
                >
                  {t('nav.login')}
                </button>

                <button
                  onClick={() => { navigate("/register"); setIsMobileMenuOpen(false); }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}