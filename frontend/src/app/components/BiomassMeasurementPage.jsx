// src/app/components/BiomassMeasurementPage.jsx
// Страница измерения биомассы с mock данными для демонстрации UI
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  Camera,
  Video,
  Upload,
  X,
  Check,
  Loader2,
  TrendingUp,
  TrendingDown,
  Leaf,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Minus,
} from "lucide-react";

// Mock данные для демонстрации
const MOCK_MEASUREMENTS = [
  {
    id: 1,
    pasture_id: 1,
    pasture_name: "Северное пастбище",
    method: "photo_upload",
    status: "completed",
    biomass_value: 2350,
    ndvi_value: 0.75,
    coverage_percent: 87.3,
    quality_score: 0.92,
    description: "Плановое измерение",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    pasture_id: 1,
    pasture_name: "Северное пастбище",
    method: "drone_video",
    status: "completed",
    biomass_value: 2180,
    ndvi_value: 0.72,
    coverage_percent: 84.5,
    quality_score: 0.95,
    drone_name: "DJI Mavic 3",
    description: "Автоматическое сканирование",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    pasture_id: 2,
    pasture_name: "Восточная долина",
    method: "photo_upload",
    status: "processing",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

export default function BiomassMeasurementPage() {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    getPastures,
    getDrones,
  } = useAuth();

  const navigate = useNavigate();

  const [pastures, setPastures] = useState([]);
  const [drones, setDrones] = useState([]);
  const [measurements, setMeasurements] = useState(MOCK_MEASUREMENTS);
  const [selectedPasture, setSelectedPasture] = useState(null);
  const [pastureStats, setPastureStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // UI состояния
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDroneStream, setShowDroneStream] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedDrone, setSelectedDrone] = useState("");
  const [droneDescription, setDroneDescription] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadData();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (selectedPasture) {
      loadPastureMeasurements(selectedPasture.id);
      calculatePastureStats(selectedPasture.id);
    }
  }, [selectedPasture]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [pasturesData, dronesData] = await Promise.all([
        getPastures(),
        getDrones(),
      ]);

      setPastures(pasturesData || []);
      setDrones(dronesData || []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
      console.error(err);

      if (err.message.includes("Сессия истекла")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPastureMeasurements = (pastureId) => {
    const filtered = MOCK_MEASUREMENTS.filter(m => m.pasture_id === pastureId);
    setMeasurements(filtered);
  };

  const calculatePastureStats = (pastureId) => {
    const filtered = MOCK_MEASUREMENTS.filter(
      m => m.pasture_id === pastureId && m.status === "completed"
    );

    if (filtered.length === 0) {
      setPastureStats(null);
      return;
    }

    const biomassValues = filtered
      .filter(m => m.biomass_value)
      .map(m => m.biomass_value);
    const ndviValues = filtered
      .filter(m => m.ndvi_value)
      .map(m => m.ndvi_value);

    let trend = "stable";
    if (biomassValues.length >= 2) {
      const latest = biomassValues[0];
      const previous = biomassValues[1];
      if (latest > previous * 1.1) {
        trend = "increasing";
      } else if (latest < previous * 0.9) {
        trend = "decreasing";
      }
    }

    const pasture = pastures.find(p => p.id === pastureId);

    setPastureStats({
      pasture_name: pasture?.name || "Неизвестно",
      total_measurements: filtered.length,
      avg_biomass: biomassValues.length > 0
        ? biomassValues.reduce((a, b) => a + b, 0) / biomassValues.length
        : null,
      latest_biomass: biomassValues[0] || null,
      avg_ndvi: ndviValues.length > 0
        ? ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length
        : null,
      latest_ndvi: ndviValues[0] || null,
      trend: trend,
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedPasture) return;

    setSubmitting(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newMeasurement = {
        id: measurements.length + 1,
        pasture_id: selectedPasture.id,
        pasture_name: selectedPasture.name,
        method: "photo_upload",
        status: "processing",
        description: uploadDescription || null,
        created_at: new Date().toISOString(),
      };

      setMeasurements([newMeasurement, ...measurements]);

      setTimeout(() => {
        setMeasurements(prev => prev.map(m => 
          m.id === newMeasurement.id
            ? {
                ...m,
                status: "completed",
                biomass_value: 2200 + Math.random() * 300,
                ndvi_value: 0.7 + Math.random() * 0.1,
                coverage_percent: 80 + Math.random() * 15,
                quality_score: 0.85 + Math.random() * 0.1,
              }
            : m
        ));
        calculatePastureStats(selectedPasture.id);
      }, 3000);

      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadDescription("");
      setShowPhotoUpload(false);
      setSuccessMessage("Фото успешно загружено! Идет обработка...");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Ошибка загрузки фото");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDroneStreamStart = async (e) => {
    e.preventDefault();
    if (!selectedDrone || !selectedPasture) return;

    setSubmitting(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const drone = drones.find(d => d.id === parseInt(selectedDrone));
      
      const newMeasurement = {
        id: measurements.length + 1,
        pasture_id: selectedPasture.id,
        pasture_name: selectedPasture.name,
        method: "drone_video",
        status: "processing",
        drone_id: parseInt(selectedDrone),
        drone_name: drone?.name || "Дрон",
        description: droneDescription || null,
        created_at: new Date().toISOString(),
      };

      setMeasurements([newMeasurement, ...measurements]);

      setTimeout(() => {
        setMeasurements(prev => prev.map(m => 
          m.id === newMeasurement.id
            ? {
                ...m,
                status: "completed",
                biomass_value: 2150 + Math.random() * 300,
                ndvi_value: 0.7 + Math.random() * 0.1,
                coverage_percent: 82 + Math.random() * 13,
                quality_score: 0.9 + Math.random() * 0.08,
              }
            : m
        ));
        calculatePastureStats(selectedPasture.id);
      }, 5000);

      setSelectedDrone("");
      setDroneDescription("");
      setShowDroneStream(false);
      setSuccessMessage("Дрон запущен! Идет сканирование...");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Ошибка запуска стрима");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeasurement = (measurementId) => {
    if (!window.confirm("Вы уверены, что хотите удалить это измерение?")) {
      return;
    }

    setMeasurements(prev => prev.filter(m => m.id !== measurementId));
    if (selectedPasture) {
      calculatePastureStats(selectedPasture.id);
    }
    setSuccessMessage("Измерение удалено");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Завершено";
      case "processing":
        return "Обработка...";
      case "failed":
        return "Ошибка";
      default:
        return "Ожидание";
    }
  };

  const getMethodText = (method) => {
    return method === "photo_upload" ? "Фото" : "Дрон";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {error && (
        <div className="fixed top-20 right-6 z-50 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="relative pt-20 pb-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600">
        <div className="relative max-w-7xl mb-10 mx-auto px-6 pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Измерение биомассы
              </h1>
              <p className="text-white/90 text-xl">
                Мониторинг состояния пастбищ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Выберите пастбище
              </h3>

              {pastures.length === 0 ? (
                <div className="text-center py-8">
                  <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Нет доступных пастбищ
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastures.map((pasture) => {
                    const pastureCount = MOCK_MEASUREMENTS.filter(
                      m => m.pasture_id === pasture.id
                    ).length;
                    
                    return (
                      <button
                        key={pasture.id}
                        type="button"
                        onClick={() => setSelectedPasture(pasture)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedPasture?.id === pasture.id
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:border-green-300 bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {pasture.name}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            {pasture.area} га
                          </span>
                          {pastureCount > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {pastureCount} измерений
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!selectedPasture ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Выберите пастбище для измерения биомассы
                </p>
              </div>
            ) : (
              <>
                {pastureStats && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Статистика: {pastureStats.pasture_name}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {pastureStats.total_measurements}
                        </p>
                        <p className="text-xs text-gray-600">Измерений</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Leaf className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {pastureStats.latest_biomass
                            ? pastureStats.latest_biomass.toFixed(0)
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-600">кг/га</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Eye className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {pastureStats.latest_ndvi
                            ? pastureStats.latest_ndvi.toFixed(2)
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-600">NDVI</p>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        {pastureStats.trend === "increasing" ? (
                          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        ) : pastureStats.trend === "decreasing" ? (
                          <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        ) : (
                          <Minus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-900">
                          {pastureStats.trend === "increasing"
                            ? "Рост"
                            : pastureStats.trend === "decreasing"
                            ? "Снижение"
                            : "Стабильно"}
                        </p>
                        <p className="text-xs text-gray-600">Тренд</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Новое измерение
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShowPhotoUpload(true)}
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                    >
                      <Camera className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          Загрузить фото
                        </p>
                        <p className="text-sm text-gray-500">
                          Измерение по фото
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDroneStream(true)}
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <Video className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Запустить дрон
                        </p>
                        <p className="text-sm text-gray-500">
                          Видеопоток
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    История измерений
                  </h3>

                  {measurements.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Измерения пока отсутствуют
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {measurements.map((measurement) => (
                        <div
                          key={measurement.id}
                          className="p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(measurement.status)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {getMethodText(measurement.method)}
                                  {measurement.drone_name && ` - ${measurement.drone_name}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    measurement.created_at
                                  ).toLocaleString("ru-RU")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  measurement.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : measurement.status === "processing"
                                    ? "bg-blue-100 text-blue-700"
                                    : measurement.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {getStatusText(measurement.status)}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteMeasurement(measurement.id)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {measurement.status === "completed" && (
                            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-xs text-gray-500">Биомасса</p>
                                <p className="font-medium text-gray-900">
                                  {measurement.biomass_value
                                    ? `${measurement.biomass_value.toFixed(0)} кг/га`
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">NDVI</p>
                                <p className="font-medium text-gray-900">
                                  {measurement.ndvi_value
                                    ? measurement.ndvi_value.toFixed(2)
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  Покрытие
                                </p>
                                <p className="font-medium text-gray-900">
                                  {measurement.coverage_percent
                                    ? `${measurement.coverage_percent.toFixed(0)}%`
                                    : "—"}
                                </p>
                              </div>
                            </div>
                          )}

                          {measurement.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {measurement.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPhotoUpload && selectedPasture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Загрузить фото
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoUpload(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setUploadDescription("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePhotoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пастбище
                </label>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-900">
                    {selectedPasture.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedPasture.area} га
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фото пастбища *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    required
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-600">
                      {selectedFile ? selectedFile.name : "Выберите файл"}
                    </span>
                  </label>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Добавьте комментарий..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Загрузить
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setUploadDescription("");
                  }}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDroneStream && selectedPasture && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Запустить дрон
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDroneStream(false);
                  setSelectedDrone("");
                  setDroneDescription("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDroneStreamStart} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пастбище
                </label>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-900">
                    {selectedPasture.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedPasture.area} га
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите дрон *
                </label>
                <select
                  value={selectedDrone}
                  onChange={(e) => setSelectedDrone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите дрон...</option>
                  {drones
                    .filter((d) => d.status === "available")
                    .map((drone) => (
                      <option key={drone.id} value={drone.id}>
                        {drone.name} - {drone.model}
                      </option>
                    ))}
                </select>

                {drones.filter((d) => d.status === "available").length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Нет доступных дронов
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={droneDescription}
                  onChange={(e) => setDroneDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Добавьте комментарий..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !selectedDrone}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Запуск...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Запустить
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDroneStream(false);
                    setSelectedDrone("");
                    setDroneDescription("");
                  }}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}