import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationKK from './locales/kk.json';
import translationRU from './locales/ru.json';
import translationEN from './locales/en.json';

const resources = {
  kk: {
    translation: translationKK,
  },
  ru: {
    translation: translationRU,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'kk', // язык по умолчанию
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
