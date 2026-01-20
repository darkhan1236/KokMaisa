// src/app/components/Features.jsx
import { Cpu, Smartphone, Cloud, Zap } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: "Прогноз биомассы на основе ИИ",
    description: "Продвинутые модели глубокого обучения, обученные на тысячах реальных полевых данных",
    gradient: "from-green-400 to-emerald-600"
  },
  {
    icon: Smartphone,
    title: "Поддержка фото с дронов и смартфонов",
    description: "Работает с изображениями как с профессиональных дронов, так и с обычных смартфонов",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    icon: Cloud,
    title: "Интеграция NDVI и погоды",
    description: "Комбинирует визуальные данные со спутниковыми NDVI и погодными условиями",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    icon: Zap,
    title: "Мгновенная оценка поля",
    description: "Получайте точные оценки биомассы за секунды, а не часы или дни",
    gradient: "from-cyan-500 to-blue-600"
  }
];

function Features() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            Возможности
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Мощные инструменты для современного управления пастбищами
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon; // Динамическая иконка

            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-green-50/50 rounded-2xl p-10 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Декоративный градиентный фон при ховере */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`}
                ></div>

                {/* Иконка в градиентном круге */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Заголовок и описание */}
                <h3 className="text-2xl mb-4 text-gray-900 font-semibold">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
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

export default Features; 