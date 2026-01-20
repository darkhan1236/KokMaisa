// src/app/components/Footer.jsx
import { Leaf, Mail, Github, BookOpen } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Основной контент футера */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Бренд и описание */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold">KokMaisa</span>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Платформа на базе ИИ для оценки биомассы пастбищ с использованием компьютерного зрения, данных NDVI и глубокого обучения для устойчивого сельского хозяйства.
            </p>
            <p className="text-gray-500 text-sm italic">
              Академический исследовательский проект, направленный на точное земледелие и устойчивое управление пастбищами.
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ресурсы</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#about" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  О проекте
                </a>
              </li>
              <li>
                <a 
                  href="#dataset" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Датасет
                </a>
              </li>
              <li>
                <a 
                  href="#model" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Модель
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Контакты
                </a>
              </li>
            </ul>
          </div>

          {/* Социальные связи */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Связь</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:contact@kokmaisa.com" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Написать нам
                </a>
              </li>
              <li>
                <a 
                  href="#github" 
                  className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть с копирайтом */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} KokMaisa. Исследовательский проект для устойчивого сельского хозяйства.
            </p>
            <p className="text-gray-600 text-sm">
              Создано с использованием компьютерного зрения и глубокого обучения
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;