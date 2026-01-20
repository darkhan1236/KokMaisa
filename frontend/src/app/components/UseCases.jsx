// src/app/components/UseCases.jsx
import { Users, Leaf, FlaskConical } from 'lucide-react';

const useCases = [
  {
    icon: Users,
    title: "Фермеры и планирование выпаса",
    description: "Принимайте обоснованные решения о перемещении скота на основе точных данных о биомассе",
    image: "https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBhc3R1cmUlMjBkcm9uZSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc2ODg0OTEzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    icon: Leaf,
    title: "Устойчивое управление пастбищами",
    description: "Контролируйте здоровье пастбищ и предотвращайте перевыпас с помощью данных в реальном времени",
    image: "https://images.unsplash.com/photo-1640076277636-e381e8645362?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFzc2xhbmQlMjBzdW5yaXNlJTIwZmllbGR8ZW58MXx8fHwxNzY4ODQ5MTM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    icon: FlaskConical,
    title: "Научные исследования и точное земледелие",
    description: "Поддерживайте научные проекты и точное земледелие с высокоточными данными по биомассе",
    image: "https://images.unsplash.com/photo-1659564455690-fee35bff87f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZhcm1pbmclMjBhZXJpYWx8ZW58MXx8fHwxNzY4ODQ5MTMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  }
];

function UseCases() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-green-50/30 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            Применение
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Помогаем разным участникам сельского хозяйства
          </p>
        </div>

        {/* Кейсы */}
        <div className="space-y-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;

            return (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } gap-8 items-center bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300`}
              >
                {/* Изображение */}
                <div className="lg:w-1/2 w-full h-80 lg:h-96 overflow-hidden">
                  <img
                    src={useCase.image}
                    alt={useCase.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Контент */}
                <div className="lg:w-1/2 w-full p-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl mb-4 text-gray-900 font-bold">
                    {useCase.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default UseCases;