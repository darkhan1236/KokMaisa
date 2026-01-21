// src/app/components/Metrics.jsx
import { Image, TrendingDown, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const metricsData = [
  {
    icon: Image,
    key: "images",
    descriptionKey: "imagesDesc",
    gradient: "from-green-400 to-emerald-600"
  },
  {
    icon: TrendingDown,
    key: "accuracy",
    descriptionKey: "accuracyDesc",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    icon: Calendar,
    key: "coverage",
    descriptionKey: "coverageDesc",
    gradient: "from-teal-500 to-cyan-600"
  }
];

function Metrics() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-green-500 to-emerald-600">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-white font-bold">
            {t('metrics.title')}
          </h2>
          <div className="w-16 h-1 bg-white/50 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {t('metrics.subtitle')}
          </p>
        </div>

        {/* Сетка метрик */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon;

            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 md:p-6 lg:p-7 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 min-h-[280px] flex flex-col justify-between"
              >
                {/* Иконка */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center mb-4 sm:mb-5 md:mb-5 shadow-lg mx-auto`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                </div>

                {/* Значение */}
                <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-white mb-1 sm:mb-2 text-center font-bold leading-tight">
                  {t(`metrics.values.${metric.key}`)}
                </div>

                {/* Метка */}
                <div className="text-base sm:text-lg md:text-lg lg:text-xl text-white/90 mb-2 md:mb-3 text-center font-semibold">
                  {t(`metrics.labels.${metric.key}`)}
                </div>

                {/* Описание */}
                <p className="text-xs sm:text-sm md:text-sm lg:text-base text-white/80 text-center leading-relaxed mt-auto">
                  {t(`metrics.descriptions.${metric.descriptionKey}`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Metrics;
