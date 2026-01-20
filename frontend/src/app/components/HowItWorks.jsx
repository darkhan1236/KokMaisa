// src/app/components/HowItWorks.jsx
import { Camera, Upload, Brain, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Сфотографируйте пастбище",
    description: "Сделайте фото с помощью дрона или камеры смартфона",
    color: "from-green-400 to-emerald-500"
  },
  {
    number: "02",
    icon: Upload,
    title: "Загрузите фото + метаданные",
    description: "Загрузите изображение вместе с координатами и датой съёмки",
    color: "from-emerald-500 to-teal-500"
  },
  {
    number: "03",
    icon: Brain,
    title: "Анализ ИИ-моделью",
    description: "Модель глубокого обучения анализирует структуру растительности и данные NDVI",
    color: "from-teal-500 to-cyan-500"
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Получите оценку биомассы",
    description: "Мгновенно получите точную оценку биомассы (кг/га) с уровнем уверенности",
    color: "from-cyan-500 to-blue-500"
  }
];

function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-green-50/30">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            Как это работает
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Четыре простых шага для получения точной оценки биомассы пастбищ
          </p>
        </div>

        {/* Сетка шагов */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon; // Динамическая иконка

            return (
              <div
                key={index}
                className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Номер шага в фоне */}
                <div className="absolute -top-4 -left-4 text-6xl font-bold text-green-100 opacity-30">
                  {step.number}
                </div>

                {/* Иконка в градиентном круге */}
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 relative z-10 shadow-md`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Заголовок и описание */}
                <h3 className="text-xl mb-3 text-gray-900 font-semibold">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
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

export default HowItWorks; 