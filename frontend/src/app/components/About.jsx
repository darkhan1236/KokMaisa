// src/app/components/About.jsx
import { useTranslation } from 'react-i18next';

function About() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок секции */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900 font-bold">
            {t('about.title')}
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-8"></div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-amber-50 rounded-3xl p-10 md:p-14 shadow-xl">
          <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-6">
            {t('about.description')}
          </p>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            {t('about.details.part1')}{' '}
            <span className="text-green-700 font-medium">
              {t('about.details.highlight1')}
            </span>{' '}
            {t('about.details.part2')}{' '}
            <span className="text-green-700 font-medium">
              {t('about.details.highlight2')}
            </span>{' '}
            {t('about.details.part3')}{' '}
            <span className="text-green-700 font-medium">
              {t('about.details.highlight3')}
            </span>
            {t('about.details.part4')}
          </p>
        </div>
      </div>
    </section>
  );
}

export default About;
