// src/app/components/Hero.jsx
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Фоновая картинка + оверлей */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1653307225485-5409bf6ef41b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBncmVlbiUyMHBhc3R1cmUlMjBmaWVsZHxlbnwxfHx8fDE3Njg4OTgwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt={t('hero.alt') || "Яркое зелёное пастбище"}
          className="w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
        {/* Бренд / Название */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight drop-shadow-lg">
            KokMaisa
          </h1>
          <div className="w-24 h-1.5 bg-green-400 mx-auto rounded-full mt-4"></div>
        </div>

        {/* Заголовок */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 md:mb-8 leading-tight drop-shadow-xl max-w-5xl mx-auto">
          {t('hero.title')}
        </h2>

        {/* Подзаголовок */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-10 md:mb-16 leading-relaxed max-w-4xl mx-auto drop-shadow-md">
          {t('hero.subtitle')}
        </p>

        {/* Кнопки CTA */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <Link
            to="/register"
            className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-full flex items-center gap-3 text-lg md:text-xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <span>{t('hero.cta')}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>

          <button
            onClick={() => {
              const target = document.querySelector('#how-it-works');
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group bg-white/15 backdrop-blur-md text-white px-8 py-4 md:px-10 md:py-5 rounded-full flex items-center gap-3 text-lg md:text-xl font-semibold border border-white/30 hover:bg-white/25 transition-all duration-300 hover:scale-105"
          >
            <Play className="w-6 h-6" />
            <span>{t('nav.howItWorks')}</span>
          </button>
        </div>

        {/* Индикатор скролла вниз
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-8 h-12 border-2 border-white/60 rounded-full flex justify-center p-2">
            <div className="w-1.5 h-4 bg-white/80 rounded-full"></div>
          </div>
        </div> */}
      </div>
    </section>
  );
}