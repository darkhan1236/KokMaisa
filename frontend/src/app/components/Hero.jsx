// Hero.jsx
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Фоновая картинка */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1653307225485-5409bf6ef41b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBncmVlbiUyMHBhc3R1cmUlMjBmaWVsZHxlbnwxfHx8fDE3Njg4OTgwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Яркое зелёное пастбище"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50"></div>
      </div>

      {/* Контент */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Логотип / Название */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl text-white mb-4 tracking-tight">
            KokMaisa
          </h1>
          <div className="w-20 h-1 bg-green-400 mx-auto rounded-full"></div>
        </div>

        {/* Заголовок */}
        <h2 className="text-4xl md:text-6xl text-white mb-6 max-w-4xl mx-auto leading-tight">
          Оценка биомассы пастбищ с помощью ИИ
        </h2>

        {/* Подзаголовок */}
        <p className="text-lg md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Загрузите фото с дрона или смартфона — и мгновенно получите оценку биомассы пастбища с использованием компьютерного зрения и данных NDVI
        </p>

        {/* Кнопки призыва к действию */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="group bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            <span className="text-lg">Оценить биомассу</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full flex items-center gap-2 transition-all duration-300 border border-white/30">
            <Play className="w-5 h-5" />
            <span className="text-lg">Как это работает</span>
          </button>
        </div>

        {/* Индикатор прокрутки (закомментирован) */}
        {/* <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-3 bg-white/70 rounded-full"></div>
          </div>
        </div> */}
      </div>
    </section>
  );
}

export default Hero;