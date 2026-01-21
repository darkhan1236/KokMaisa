// src/app/components/Footer.jsx
import { Leaf, Mail, Github, BookOpen, Facebook, Twitter, Instagram } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Основной контент */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Бренд и описание */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight">KokMaisa</span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <p className="text-gray-500 text-sm italic">
              {t('footer.academicNote') || 'Академический проект для устойчивого управления пастбищами в Казахстане'}
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="text-xl font-semibold mb-6">{t('footer.quickLinks')}</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/#about" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/#how-it-works" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('nav.howItWorks')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/#features" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('nav.features')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/#use-cases" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('nav.useCases')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты + Соцсети */}
          <div>
            <h3 className="text-xl font-semibold mb-6">{t('footer.contact')}</h3>
            <ul className="space-y-4 mb-8">
              <li>
                <a 
                  href="mailto:info@kokmaysa.kz" 
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <Mail className="w-5 h-5" />
                  info@kokmaysa.kz
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/yourusername/kokmaysa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-green-400 transition-colors flex items-center gap-3 text-lg"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
              </li>
            </ul>

            <h4 className="text-lg font-medium mb-4">{t('footer.followUs')}</h4>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-600 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-600 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-600 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Нижняя полоса */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>
            © {currentYear} KokMaisa. {t('footer.allRightsReserved')}.
          </p>
          <p className="mt-2">
            Создано в Караганде для устойчивого будущего сельского хозяйства Казахстана
          </p>
        </div>
      </div>
    </footer>
  );
}