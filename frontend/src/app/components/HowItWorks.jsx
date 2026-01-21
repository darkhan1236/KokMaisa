// src/app/components/HowItWorks.jsx
import { Camera, Upload, Brain, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      icon: Camera,
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
      color: "from-green-400 to-emerald-500"
    },
    {
      number: "02",
      icon: Upload,
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
      color: "from-emerald-500 to-teal-500"
    },
    {
      number: "03",
      icon: Brain,
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
      color: "from-teal-500 to-cyan-500"
    },
    {
      number: "04",
      icon: TrendingUp,
      title: t('howItWorks.step4Title'),
      description: t('howItWorks.step4Desc'),
      color: "from-cyan-500 to-blue-500"
    }
  ];

  return (
    <section 
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-white to-green-50/40" 
      id="how-it-works"
    >
      <div className="max-w-6xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t('howItWorks.title')}
          </h2>
          <div className="w-20 h-1.5 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Сетка шагов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="relative bg-white rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 group overflow-hidden border border-gray-100"
              >
                {/* Номер шага (большой фон) */}
                <div className="absolute -top-8 -left-4 text-8xl md:text-9xl font-black text-green-100/30 pointer-events-none select-none group-hover:text-green-50/40 transition-colors">
                  {step.number}
                </div>

                {/* Иконка */}
                <div 
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-8 shadow-lg transform group-hover:scale-110 transition-transform duration-500 relative z-10`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Текст */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-green-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}