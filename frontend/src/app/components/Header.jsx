// src/app/components/Header.jsx
import { Leaf, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Очистка при размонтировании
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'О проекте', href: '#about' },
    { label: 'Как работает', href: '#how-it-works' },
    { label: 'Функции', href: '#features' },
    { label: 'Контакты', href: '#contact' }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span
              className={`text-2xl transition-colors duration-300 ${
                isScrolled ? 'text-gray-900' : 'text-white'
              } font-semibold`}
            >
              KokMaisa
            </span>
          </Link>

          {/* Навигация для десктопа */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-8">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`text-lg transition-all duration-300 hover:scale-105 ${
                  isScrolled
                    ? 'text-gray-700 hover:text-green-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Кнопки авторизации (десктоп) */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => navigate('/login')}
              className={`px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 ${
                isScrolled
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Регистрация
            </button>
          </div>

          {/* Кнопка мобильного меню */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden mt-4 py-6 rounded-2xl ${
              isScrolled ? 'bg-white' : 'bg-gray-900/95 backdrop-blur-md'
            } shadow-xl`}
          >
            <nav className="flex flex-col gap-4 px-4 mb-6">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-lg py-2 transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-green-600'
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-3 px-4">
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className={`px-6 py-3 rounded-full transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                    : 'text-white hover:bg-white/10 border border-white/30'
                }`}
              >
                Вход
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setIsMobileMenuOpen(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Регистрация
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;