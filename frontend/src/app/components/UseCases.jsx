// src/app/components/UseCases.jsx
import { Users, Leaf, FlaskConical } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function UseCases() {
  const { t } = useTranslation();

  const useCases = [
    {
      icon: Users,
      title: t('useCases.case1'),
      description: t('useCases.case1Desc'),
      image: "https://images.unsplash.com/photo-1677126577258-1a82fdf1a976?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBhc3R1cmUlMjBkcm9uZSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc2ODg0OTEzM3ww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      icon: Leaf,
      title: t('useCases.case2'),
      description: t('useCases.case2Desc'),
      image: "https://images.unsplash.com/photo-1640076277636-e381e8645362?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFzc2xhbmQlMjBzdW5yaXNlJTIwZmllbGR8ZW58MXx8fHwxNzY4ODQ5MTM0fDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      icon: FlaskConical,
      title: t('useCases.case3'),
      description: t('useCases.case3Desc'),
      image: "https://images.unsplash.com/photo-1659564455690-fee35bff87f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZhcm1pbmclMjBhZXJpYWx8ZW58MXx8fHwxNzY4ODQ5MTMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  return (
    <section 
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-green-50/40 to-white" 
      id="use-cases"
    >
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t('useCases.title')}
          </h2>
          <div className="w-20 h-1.5 bg-green-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('useCases.subtitle')}
          </p>
        </div>

        {/* Кейсы */}
        <div className="space-y-12 lg:space-y-16">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`flex flex-col lg:flex-row ${
                index % 2 === 0 ? '' : 'lg:flex-row-reverse'
              } gap-8 lg:gap-12 items-center bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500`}
            >
              {/* Изображение */}
              <div className="lg:w-1/2 w-full h-80 lg:h-[500px] overflow-hidden">
                <img
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
              </div>

              {/* Контент */}
              <div className="lg:w-1/2 w-full p-8 md:p-12 lg:p-16">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-8 shadow-lg">
                  <useCase.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {useCase.title}
                </h3>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}