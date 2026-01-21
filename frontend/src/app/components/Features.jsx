// src/app/components/Features.jsx
import { Satellite, BarChart, Brain, Smartphone, Cloud, Zap } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Satellite,
      title: t('features.feature1'),
      description: t('features.feature1Desc'),
      gradient: "from-green-400 to-emerald-600"
    },
    {
      icon: BarChart,
      title: t('features.feature2'),
      description: t('features.feature2Desc'),
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: Brain,
      title: t('features.feature3'),
      description: t('features.feature3Desc'),
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      icon: Smartphone,
      title: t('features.feature4'),
      description: t('features.feature4Desc'),
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Cloud,
      title: t('features.feature5'),
      description: t('features.feature5Desc'),
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: Zap,
      title: t('features.feature6'),
      description: t('features.feature6Desc'),
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <section className="py-24 px-6 bg-white" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            {t('features.title')}
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Декоративный градиентный блик */}
                <div
                  className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl group-hover:scale-125 group-hover:opacity-20 transition-all duration-500`}
                ></div>

                {/* Иконка */}
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-md transform group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Текст */}
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}