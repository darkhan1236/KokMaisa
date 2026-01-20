// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './app/components/HomePage';
import RegisterPage from './app/components/RegisterPage';
import LoginPage from './app/components/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;