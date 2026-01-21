import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем пользователя из localStorage при инициализации
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Получаем всех пользователей
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Ищем пользователя
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      // Не сохраняем пароль в текущей сессии
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    
    return { success: false, error: 'Неверный email или пароль' };
  };

  const register = (userData) => {
    // Получаем всех пользователей
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Проверяем, существует ли пользователь
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    // Создаём нового пользователя
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // Инициализируем пустой профиль
      profile: {
        farms: [], // для фермера
        assignedFarms: [], // для агронома
      }
    };
    
    // Сохраняем пользователя
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Автоматически логиним
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = (profileData) => {
    if (!user) return { success: false, error: 'Пользователь не авторизован' };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], profile: { ...users[userIndex].profile, ...profileData } };
      localStorage.setItem('users', JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = users[userIndex];
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return { success: true };
    }
    
    return { success: false, error: 'Ошибка обновления профиля' };
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
