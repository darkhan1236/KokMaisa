import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Leaf, 
  LogOut, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Plus,
  Edit,
  Trash2,
  Map as MapIcon
} from "lucide-react";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export function ProfileFarmer() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [farmData, setFarmData] = useState({
    name: "",
    location: "",
    area: "",
    coordinates: { lat: "", lng: "" }
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddFarm = (e) => {
    e.preventDefault();
    
    const newFarm = {
      id: Date.now().toString(),
      ...farmData,
      createdAt: new Date().toISOString()
    };

    const currentFarms = user?.profile?.farms || [];
    updateProfile({ farms: [...currentFarms, newFarm] });
    
    setFarmData({
      name: "",
      location: "",
      area: "",
      coordinates: { lat: "", lng: "" }
    });
    setShowAddFarm(false);
  };

  const handleDeleteFarm = (farmId) => {
    if (window.confirm("Вы уверены, что хотите удалить эту ферму?")) {
      const updatedFarms = (user?.profile?.farms || []).filter(f => f.id !== farmId);
      updateProfile({ farms: updatedFarms });
    }
  };

  if (!user) return null;

  const farms = user?.profile?.farms || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-900">KokMaisa</h1>
                <p className="text-sm text-gray-500">Профиль фермера</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl text-gray-900 mb-1">{user.fullName}</h2>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Фермер
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Местоположение</p>
                    <p className="text-gray-900">{user.city}, {user.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Farms */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Мои фермы</h3>
                <button
                  onClick={() => setShowAddFarm(!showAddFarm)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Добавить ферму</span>
                </button>
              </div>

              {/* Add Farm Form */}
              {showAddFarm && (
                <form onSubmit={handleAddFarm} className="mb-6 p-6 bg-gray-50 rounded-xl">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Новая ферма</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Название фермы *</label>
                      <input
                        type="text"
                        value={farmData.name}
                        onChange={(e) => setFarmData({...farmData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Моя ферма"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Местоположение *</label>
                      <input
                        type="text"
                        value={farmData.location}
                        onChange={(e) => setFarmData({...farmData, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Район, область"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Площадь (га)</label>
                      <input
                        type="number"
                        value={farmData.area}
                        onChange={(e) => setFarmData({...farmData, area: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">GPS координаты</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={farmData.coordinates.lat}
                          onChange={(e) => setFarmData({...farmData, coordinates: {...farmData.coordinates, lat: e.target.value}})}
                          className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Широта"
                        />
                        <input
                          type="text"
                          value={farmData.coordinates.lng}
                          onChange={(e) => setFarmData({...farmData, coordinates: {...farmData.coordinates, lng: e.target.value}})}
                          className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Долгота"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddFarm(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {/* Farms List */}
              {farms.length === 0 ? (
                <div className="text-center py-12">
                  <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">У вас пока нет ферм</p>
                  <p className="text-gray-400">Добавьте свою первую ферму, чтобы начать работу</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {farms.map((farm) => (
                    <div key={farm.id} className="p-6 border border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{farm.name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {farm.location}
                            </p>
                            {farm.area && (
                              <p>Площадь: {farm.area} га</p>
                            )}
                            {farm.coordinates?.lat && farm.coordinates?.lng && (
                              <p className="font-mono text-xs">
                                GPS: {farm.coordinates.lat}, {farm.coordinates.lng}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteFarm(farm.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
