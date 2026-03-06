// src/app/components/BiomassMeasurementPage.jsx
// Расширенная версия: анализ качества травы + расчёт заготовки на зиму
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  Camera, Video, Upload, X, Check, Loader2,
  TrendingUp, TrendingDown, Leaf, BarChart3,
  Clock, CheckCircle2, XCircle, AlertCircle,
  Eye, Trash2, Minus, RefreshCw, FlaskConical,
  Wheat, Calculator, ChevronDown, ChevronUp,
  Droplets, Thermometer, Zap, Shield,
} from "lucide-react";

// ─── Mock данные для анализа качества ────────────────────────────────────────
const MOCK_QUALITY_DATA = {
  grass_composition: [
    { name: "Ковыль", percent: 32, color: "#22c55e" },
    { name: "Типчак", percent: 24, color: "#86efac" },
    { name: "Полынь", percent: 18, color: "#bef264" },
    { name: "Пырей", percent: 14, color: "#fbbf24" },
    { name: "Прочие", percent: 12, color: "#d1d5db" },
  ],
  nutrients: {
    protein: { value: 14.2, unit: "%", norm: [12, 18], label: "Сырой протеин" },
    fiber:   { value: 28.5, unit: "%", norm: [25, 35], label: "Клетчатка" },
    fat:     { value: 3.1,  unit: "%", norm: [2, 4],   label: "Жир" },
    ash:     { value: 7.8,  unit: "%", norm: [6, 10],  label: "Зола" },
  },
  soil: {
    ph:         { value: 6.8,  unit: "",    norm: [6.0, 7.5], label: "pH почвы" },
    nitrogen:   { value: 2.3,  unit: "г/кг", norm: [1.5, 3.5], label: "Азот (N)" },
    phosphorus: { value: 1.1,  unit: "г/кг", norm: [0.8, 1.8], label: "Фосфор (P)" },
    potassium:  { value: 18.4, unit: "г/кг", norm: [15, 25],  label: "Калий (K)" },
    moisture:   { value: 22,   unit: "%",    norm: [18, 30],  label: "Влажность" },
  },
  quality_score: 78,
  quality_label: "Хорошее",
  quality_color: "text-green-600",
  recommendations: [
    "Рекомендуется известкование для нейтрализации кислотности",
    "Уровень протеина в норме — пастбище пригодно для дойных коров",
    "Высокое содержание ковыля — хорошо для лошадей",
  ],
};

// ─── Константы для расчёта кормления ─────────────────────────────────────────
const ANIMAL_CONFIGS = [
  {
    key: "cow",
    label: "Коровы",
    emoji: "🐄",
    color: "bg-amber-500",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-amber-700",
    dailyKg: 9,       // кг/голову/день (среднее 8–10)
    dailyRange: "8–10",
    unit: "кг/день",
  },
  {
    key: "sheep",
    label: "Бараны/Овцы",
    emoji: "🐑",
    color: "bg-sky-500",
    lightBg: "bg-sky-50",
    border: "border-sky-200",
    textColor: "text-sky-700",
    dailyKg: 2.5,
    dailyRange: "2–3",
    unit: "кг/день",
  },
  {
    key: "horse",
    label: "Лошади",
    emoji: "🐎",
    color: "bg-purple-500",
    lightBg: "bg-purple-50",
    border: "border-purple-200",
    textColor: "text-purple-700",
    dailyKg: 13,
    dailyRange: "12–14",
    unit: "кг/день",
  },
];

const WINTER_DAYS = 180; // дней зимовки
const HECTARES    = 100; // расчётная площадь

// ─── Функция расчёта ──────────────────────────────────────────────────────────
function calcWinterFodder(biomassPerHa) {
  // biomassPerHa в ц/га → 1 ц = 100 кг
  const totalKg = biomassPerHa * HECTARES * 100; // кг на 100 га

  return ANIMAL_CONFIGS.map((animal) => {
    const needed100   = animal.dailyKg * 100 * WINTER_DAYS; // кг на 100 голов за зиму
    const headsCovered = Math.floor(totalKg / (animal.dailyKg * WINTER_DAYS)); // сколько голов прокормит
    const daysFor100  = Math.floor(totalKg / (animal.dailyKg * 100));          // дней на 100 голов
    const sufficient  = totalKg >= needed100;
    const pct         = Math.min(100, Math.round((totalKg / needed100) * 100));
    return { ...animal, totalKg, needed100, headsCovered, daysFor100, sufficient, pct };
  });
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function BiomassMeasurementPage() {
  const {
    user, isAuthenticated, loading: authLoading,
    getPastures, getDrones,
    uploadBiomassPhoto, startDroneMeasurement,
    getPastureMeasurements, getPastureStats,
    deleteMeasurement,
  } = useAuth();

  const navigate = useNavigate();

  const [pastures,        setPastures]        = useState([]);
  const [drones,          setDrones]          = useState([]);
  const [measurements,    setMeasurements]    = useState([]);
  const [selectedPasture, setSelectedPasture] = useState(null);
  const [pastureStats,    setPastureStats]    = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [statsLoading,    setStatsLoading]    = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState(null);
  const [successMessage,  setSuccessMessage]  = useState(null);

  // Новые секции
  const [showQuality,     setShowQuality]     = useState(true);
  const [showCalculator,  setShowCalculator]  = useState(true);
  const [customHeads,     setCustomHeads]     = useState({ cow: 100, sheep: 100, horse: 100 });
  const [customHectares,  setCustomHectares]  = useState(HECTARES);
  const [customDays,      setCustomDays]      = useState(WINTER_DAYS);

  // Modal state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDroneStream, setShowDroneStream] = useState(false);
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [previewUrl,      setPreviewUrl]      = useState(null);
  const [uploadDesc,      setUploadDesc]      = useState("");
  const [selectedDrone,   setSelectedDrone]   = useState("");
  const [droneDesc,       setDroneDesc]       = useState("");

  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(null), 3500); };
  const showError   = (msg) => { setError(msg);          setTimeout(() => setError(null), 5000); };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    loadInitialData();
  }, [authLoading, isAuthenticated]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [pasturesData, dronesData] = await Promise.all([getPastures(), getDrones()]);
      setPastures(pasturesData || []);
      setDrones(dronesData || []);
    } catch (err) {
      showError(err.message || "Не удалось загрузить данные");
      if (err.message.includes("Сессия истекла")) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadPastureData = useCallback(async (pastureId) => {
    setStatsLoading(true);
    setMeasurements([]);
    setPastureStats(null);
    try {
      const [mData, sData] = await Promise.all([
        getPastureMeasurements(pastureId),
        getPastureStats(pastureId),
      ]);
      setMeasurements(mData || []);
      setPastureStats(sData || null);
    } catch (err) {
      showError(err.message || "Ошибка загрузки данных пастбища");
    } finally {
      setStatsLoading(false);
    }
  }, [getPastureMeasurements, getPastureStats]);

  useEffect(() => {
    if (selectedPasture) loadPastureData(selectedPasture.id);
  }, [selectedPasture]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedPasture) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await uploadBiomassPhoto(selectedFile, selectedPasture.id, uploadDesc);
      setMeasurements((prev) => [result, ...prev]);
      const stats = await getPastureStats(selectedPasture.id);
      setPastureStats(stats);
      setSelectedFile(null); setPreviewUrl(null); setUploadDesc(""); setShowPhotoUpload(false);
      showSuccess(`✅ Биомасса: ${result.biomass_value?.toFixed(1)} ц/га`);
    } catch (err) {
      showError(err.message || "Ошибка загрузки фото");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDroneStart = async (e) => {
    e.preventDefault();
    if (!selectedDrone || !selectedPasture) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await startDroneMeasurement(selectedPasture.id, parseInt(selectedDrone), droneDesc);
      setMeasurements((prev) => [result, ...prev]);
      setSelectedDrone(""); setDroneDesc(""); setShowDroneStream(false);
      showSuccess("🚁 Дрон запущен! Ожидайте результатов...");
    } catch (err) {
      showError(err.message || "Ошибка запуска дрона");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить это измерение?")) return;
    try {
      await deleteMeasurement(id);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      const stats = await getPastureStats(selectedPasture.id);
      setPastureStats(stats);
      showSuccess("Измерение удалено");
    } catch (err) {
      showError(err.message || "Ошибка удаления");
    }
  };

  const getStatusIcon = (status) => {
    const cls = "w-5 h-5";
    switch (status) {
      case "completed":  return <CheckCircle2 className={`${cls} text-green-500`} />;
      case "processing": return <Loader2      className={`${cls} text-blue-500 animate-spin`} />;
      case "failed":     return <XCircle      className={`${cls} text-red-500`} />;
      default:           return <Clock        className={`${cls} text-gray-400`} />;
    }
  };
  const statusLabel = { completed: "Завершено", processing: "Обработка...", failed: "Ошибка" };
  const statusBadge = {
    completed:  "bg-green-100 text-green-700",
    processing: "bg-blue-100  text-blue-700",
    failed:     "bg-red-100   text-red-700",
  };

  // Биомасса для калькулятора: берём последнее измерение или из stats
  const activeBiomass = pastureStats?.latest_biomass ?? 18.5; // 18.5 ц/га — мок если нет данных

  // Расчёт с учётом пользовательских настроек
  const calcCustomFodder = (biomassPerHa) => {
    const totalKg = biomassPerHa * customHectares * 100;
    return ANIMAL_CONFIGS.map((animal) => {
      const heads    = customHeads[animal.key];
      const needed   = animal.dailyKg * heads * customDays;
      const headsCov = Math.floor(totalKg / (animal.dailyKg * customDays));
      const daysCov  = Math.floor(totalKg / (animal.dailyKg * heads));
      const sufficient = totalKg >= needed;
      const pct = Math.min(100, Math.round((totalKg / needed) * 100));
      return { ...animal, totalKg, needed, headsCov, daysCov, sufficient, pct, heads };
    });
  };

  const fodderData = calcCustomFodder(activeBiomass);
  const totalAvailableKg = activeBiomass * customHectares * 100;

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

      {/* Тосты */}
      {error && (
        <div className="fixed top-20 right-6 z-50 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-lg max-w-sm">
          <div className="flex items-center gap-2"><XCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p></div>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r shadow-lg max-w-sm">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{successMessage}</p></div>
        </div>
      )}

      {/* Hero */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600">
        <div className="relative max-w-7xl mb-10 mx-auto px-6 pt-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Измерение биомассы</h1>
          <p className="text-white/90 text-xl">Мониторинг состояния пастбищ · Анализ качества · Расчёт заготовки</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Боковая панель пастбищ ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите пастбище</h3>
              {pastures.length === 0 ? (
                <div className="text-center py-8">
                  <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Нет доступных пастбищ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastures.map((pasture) => (
                    <button key={pasture.id} type="button" onClick={() => setSelectedPasture(pasture)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedPasture?.id === pasture.id
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 hover:border-green-300 bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{pasture.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{pasture.area} га</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Мок-качество в сайдбаре */}
              {selectedPasture && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Общая оценка качества</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700"
                      style={{ width: `${MOCK_QUALITY_DATA.quality_score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={`font-semibold ${MOCK_QUALITY_DATA.quality_color}`}>
                      {MOCK_QUALITY_DATA.quality_label} — {MOCK_QUALITY_DATA.quality_score}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Основной контент ── */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedPasture ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Выберите пастбище для измерения биомассы</p>
              </div>
            ) : (
              <>
                {/* ── Статистика ── */}
                {statsLoading ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : pastureStats ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Статистика: {pastureStats.pasture_name}
                      </h3>
                      <button type="button" onClick={() => loadPastureData(selectedPasture.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Stat icon={<BarChart3 className="w-6 h-6 text-blue-500" />}
                            value={pastureStats.total_measurements} label="Измерений" />
                      <Stat icon={<Leaf className="w-6 h-6 text-green-500" />}
                            value={pastureStats.latest_biomass != null ? `${pastureStats.latest_biomass.toFixed(1)}` : "—"}
                            label="ц/га" />
                      <Stat icon={<Eye className="w-6 h-6 text-purple-500" />}
                            value={pastureStats.latest_ndvi != null ? pastureStats.latest_ndvi.toFixed(2) : "—"}
                            label="NDVI" />
                      <Stat icon={
                              pastureStats.trend === "increasing" ? <TrendingUp className="w-6 h-6 text-green-500" />
                              : pastureStats.trend === "decreasing" ? <TrendingDown className="w-6 h-6 text-red-500" />
                              : <Minus className="w-6 h-6 text-gray-400" />
                            }
                            value={
                              pastureStats.trend === "increasing" ? "Рост"
                              : pastureStats.trend === "decreasing" ? "Снижение"
                              : "Стабильно"
                            }
                            label="Тренд" />
                    </div>
                  </div>
                ) : null}

                {/* ── Кнопки нового измерения ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Новое измерение</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button type="button" onClick={() => setShowPhotoUpload(true)}
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group">
                      <Camera className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-green-600">Загрузить фото</p>
                        <p className="text-sm text-gray-500">AI-предсказание биомассы</p>
                      </div>
                    </button>
                    <button type="button" onClick={() => setShowDroneStream(true)}
                      className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                      <Video className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600">Запустить дрон</p>
                        <p className="text-sm text-gray-500">Видеосканирование</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════
                    БЛОК: Анализ качества травы и почвы (мок-данные)
                ════════════════════════════════════════════════════════ */}
                <CollapsibleCard
                  title="Анализ качества травы и почвы"
                  subtitle="Интеграция с лаб. анализом в разработке"
                  icon={<FlaskConical className="w-5 h-5 text-emerald-600" />}
                  badgeColor="bg-amber-100 text-amber-700"
                  open={showQuality}
                  onToggle={() => setShowQuality((v) => !v)}
                >
                  <div className="space-y-6 pt-2">

                    {/* Состав трав — круговая диаграмма (CSS) */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-500" />
                        Видовой состав трав
                      </h4>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {MOCK_QUALITY_DATA.grass_composition.map((g) => (
                          <div key={g.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                            <span className="text-sm text-gray-700">{g.name}</span>
                            <span className="text-sm font-semibold text-gray-900">{g.percent}%</span>
                          </div>
                        ))}
                      </div>
                      {/* Горизонтальные полосы */}
                      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                        {MOCK_QUALITY_DATA.grass_composition.map((g) => (
                          <div
                            key={g.name}
                            className="h-full transition-all duration-700"
                            style={{ width: `${g.percent}%`, backgroundColor: g.color }}
                            title={`${g.name}: ${g.percent}%`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Питательные вещества */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Питательная ценность
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.values(MOCK_QUALITY_DATA.nutrients).map((n) => (
                          <NutrientBar key={n.label} {...n} />
                        ))}
                      </div>
                    </div>

                    {/* Показатели почвы */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        Показатели почвы
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.values(MOCK_QUALITY_DATA.soil).map((s) => (
                          <SoilCard key={s.label} {...s} />
                        ))}
                      </div>
                    </div>

                    {/* Рекомендации */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Рекомендации агронома
                      </h4>
                      <ul className="space-y-1">
                        {MOCK_QUALITY_DATA.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleCard>

                {/* ════════════════════════════════════════════════════════
                    БЛОК: Калькулятор заготовки на зиму
                ════════════════════════════════════════════════════════ */}
                <CollapsibleCard
                  title="Расчёт заготовки корма на зиму"
                  subtitle={`Биомасса: ${activeBiomass.toFixed(1)} ц/га · Доступно: ${(totalAvailableKg / 1000).toFixed(1)} тонн с ${customHectares} га`}
                  icon={<Calculator className="w-5 h-5 text-orange-500" />}
                  badgeText={`${(totalAvailableKg / 1000).toFixed(1)} т`}
                  badgeColor="bg-green-100 text-green-700"
                  open={showCalculator}
                  onToggle={() => setShowCalculator((v) => !v)}
                >
                  <div className="space-y-6 pt-2">

                    {/* Параметры расчёта */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Параметры расчёта</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <CalcInput
                          label="Гектаров"
                          value={customHectares}
                          onChange={(v) => setCustomHectares(Math.max(1, v))}
                          suffix="га"
                        />
                        <CalcInput
                          label="Дней зимовки"
                          value={customDays}
                          onChange={(v) => setCustomDays(Math.max(1, v))}
                          suffix="дн"
                        />
                        <CalcInput
                          label="Голов коров"
                          value={customHeads.cow}
                          onChange={(v) => setCustomHeads((h) => ({ ...h, cow: Math.max(0, v) }))}
                          suffix="🐄"
                        />
                        <CalcInput
                          label="Голов овец"
                          value={customHeads.sheep}
                          onChange={(v) => setCustomHeads((h) => ({ ...h, sheep: Math.max(0, v) }))}
                          suffix="🐑"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <CalcInput
                          label="Голов лошадей"
                          value={customHeads.horse}
                          onChange={(v) => setCustomHeads((h) => ({ ...h, horse: Math.max(0, v) }))}
                          suffix="🐎"
                        />
                        <div className="col-span-3 flex items-end">
                          <div className="p-3 bg-white rounded-lg border border-gray-200 w-full">
                            <p className="text-xs text-gray-500 mb-1">Всего доступно сена</p>
                            <p className="text-xl font-bold text-green-600">
                              {(totalAvailableKg / 1000).toFixed(2)} тонн
                            </p>
                            <p className="text-xs text-gray-400">
                              = {activeBiomass.toFixed(1)} ц/га × {customHectares} га × 100 кг/ц
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Карточки животных */}
                    <div className="space-y-4">
                      {fodderData.map((animal) => (
                        <AnimalFodderCard key={animal.key} animal={animal} winterDays={customDays} />
                      ))}
                    </div>

                    {/* Сводная таблица */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Сводная таблица — {customDays} дней зимовки
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-4 py-2 text-gray-600 font-medium">Животные</th>
                              <th className="text-right px-4 py-2 text-gray-600 font-medium">Голов</th>
                              <th className="text-right px-4 py-2 text-gray-600 font-medium">Норма/день</th>
                              <th className="text-right px-4 py-2 text-gray-600 font-medium">Нужно, т</th>
                              <th className="text-right px-4 py-2 text-gray-600 font-medium">Хватит дней</th>
                              <th className="text-center px-4 py-2 text-gray-600 font-medium">Статус</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fodderData.map((a) => (
                              <tr key={a.key} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{a.emoji} {a.label}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{a.heads}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{a.dailyRange} кг</td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  {(a.needed / 1000).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold"
                                    style={{ color: a.daysCov >= customDays ? "#16a34a" : "#dc2626" }}>
                                  {a.daysCov}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {a.sufficient
                                    ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Достаточно</span>
                                    : <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">✗ Нехватка</span>
                                  }
                                </td>
                              </tr>
                            ))}
                            {/* Итого */}
                            <tr className="bg-green-50 font-semibold">
                              <td className="px-4 py-3 text-gray-900" colSpan={3}>Итого потребность</td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {(fodderData.reduce((s, a) => s + a.needed, 0) / 1000).toFixed(2)} т
                              </td>
                              <td colSpan={2} className="px-4 py-3 text-right text-sm text-gray-600">
                                Доступно: {(totalAvailableKg / 1000).toFixed(2)} т
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Итоговый вывод */}
                    <TotalSummary fodderData={fodderData} totalKg={totalAvailableKg} winterDays={customDays} />
                  </div>
                </CollapsibleCard>

                {/* ── История измерений ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">История измерений</h3>
                    <button type="button" onClick={() => loadPastureData(selectedPasture.id)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {statsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                  ) : measurements.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Измерения пока отсутствуют</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {measurements.map((m) => (
                        <div key={m.id}
                          className="p-4 border border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(m.status)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {m.method === "photo_upload" ? "Фото" : "Дрон"}
                                  {m.drone_name && ` — ${m.drone_name}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(m.created_at).toLocaleString("ru-RU")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[m.status] || "bg-gray-100 text-gray-700"}`}>
                                {statusLabel[m.status] || "Ожидание"}
                              </span>
                              <button type="button" onClick={() => handleDelete(m.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {m.status === "completed" && (
                            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
                              <ResultCell label="Биомасса" value={m.biomass_value != null ? `${m.biomass_value.toFixed(1)} ц/га` : "—"} />
                              <ResultCell label="NDVI"     value={m.ndvi_value != null ? m.ndvi_value.toFixed(3) : "—"} />
                              <ResultCell label="Покрытие" value={m.coverage_percent != null ? `${m.coverage_percent.toFixed(0)}%` : "—"} />
                            </div>
                          )}
                          {m.description && (
                            <p className="text-sm text-gray-500 mt-2 italic">{m.description}</p>
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

      {/* ── Модал загрузки фото ── */}
      {showPhotoUpload && selectedPasture && (
        <Modal title="Загрузить фото" onClose={() => { setShowPhotoUpload(false); setSelectedFile(null); setPreviewUrl(null); setUploadDesc(""); }}>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <PastureInfo pasture={selectedPasture} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Фото пастбища *</label>
              <input type="file" accept="image/*" onChange={handleFileSelect} required className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600">{selectedFile ? selectedFile.name : "Выберите файл"}</span>
              </label>
              {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 w-full h-48 object-cover rounded-xl" />}
            </div>
            <DescriptionField value={uploadDesc} onChange={setUploadDesc} />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">⏱ Предсказание занимает 2–10 секунд на сервере (GPU/CPU).</p>
            </div>
            <ModalButtons onCancel={() => { setShowPhotoUpload(false); setSelectedFile(null); setPreviewUrl(null); setUploadDesc(""); }}
              submitting={submitting} disabled={!selectedFile}
              submitLabel="Загрузить и предсказать" submitColor="bg-green-500 hover:bg-green-600"
              icon={<Check className="w-5 h-5" />} />
          </form>
        </Modal>
      )}

      {/* ── Модал дрона ── */}
      {showDroneStream && selectedPasture && (
        <Modal title="Запустить дрон" onClose={() => { setShowDroneStream(false); setSelectedDrone(""); setDroneDesc(""); }}>
          <form onSubmit={handleDroneStart} className="space-y-4">
            <PastureInfo pasture={selectedPasture} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Выберите дрон *</label>
              <select value={selectedDrone} onChange={(e) => setSelectedDrone(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Выберите дрон...</option>
                {drones.filter((d) => d.status === "available").map((drone) => (
                  <option key={drone.id} value={drone.id}>{drone.name} — {drone.model}</option>
                ))}
              </select>
              {drones.filter((d) => d.status === "available").length === 0 && (
                <p className="text-sm text-amber-600 mt-2">Нет доступных дронов</p>
              )}
            </div>
            <DescriptionField value={droneDesc} onChange={setDroneDesc} />
            <ModalButtons onCancel={() => { setShowDroneStream(false); setSelectedDrone(""); setDroneDesc(""); }}
              submitting={submitting} disabled={!selectedDrone}
              submitLabel="Запустить" submitColor="bg-blue-500 hover:bg-blue-600"
              icon={<Video className="w-5 h-5" />} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function CollapsibleCard({ title, subtitle, icon, badgeText, badgeColor, open, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-xl">{icon}</div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badgeText && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>{badgeText}</span>
              )}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
               : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

function NutrientBar({ label, value, unit, norm }) {
  const [min, max] = norm;
  const pct = Math.min(100, ((value - min) / (max - min)) * 100);
  const inRange = value >= min && value <= max;
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${inRange ? "text-green-600" : "text-orange-500"}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${inRange ? "bg-green-400" : "bg-orange-400"}`}
          style={{ width: `${Math.max(5, Math.min(100, (value / max) * 100))}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">норма: {min}–{max}{unit}</div>
    </div>
  );
}

function SoilCard({ label, value, unit, norm }) {
  const [min, max] = norm;
  const inRange = value >= min && value <= max;
  return (
    <div className={`rounded-xl p-3 border ${inRange ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${inRange ? "text-green-700" : "text-orange-600"}`}>
        {value}<span className="text-sm font-normal ml-1">{unit}</span>
      </p>
      <p className="text-xs text-gray-400">норма: {min}–{max}</p>
    </div>
  );
}

function AnimalFodderCard({ animal, winterDays }) {
  const totalTons = (animal.totalKg / 1000).toFixed(2);
  const neededTons = (animal.needed / 1000).toFixed(2);
  const deficit = animal.needed > animal.totalKg ? ((animal.needed - animal.totalKg) / 1000).toFixed(2) : null;

  return (
    <div className={`rounded-2xl border p-5 ${animal.lightBg} ${animal.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{animal.emoji}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{animal.label}</h4>
            <p className="text-sm text-gray-600">{animal.heads} голов · {animal.dailyRange} кг/день/голову</p>
          </div>
        </div>
        <div className="text-right">
          {animal.sufficient
            ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Достаточно</span>
            : <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">✗ Нехватка {deficit} т</span>
          }
        </div>
      </div>

      {/* Прогресс */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1.5">
          <span>Обеспеченность кормом</span>
          <span className="font-semibold">{animal.pct}%</span>
        </div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white/40">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              animal.pct >= 100 ? "bg-green-500" : animal.pct >= 70 ? "bg-amber-400" : "bg-red-500"
            }`}
            style={{ width: `${animal.pct}%` }}
          />
        </div>
      </div>

      {/* Цифры */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Доступно</p>
          <p className="font-bold text-gray-900">{totalTons} т</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Нужно</p>
          <p className="font-bold text-gray-900">{neededTons} т</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Хватит на</p>
          <p className={`font-bold ${animal.daysCov >= winterDays ? "text-green-600" : "text-red-600"}`}>
            {animal.daysCov} дн.
          </p>
        </div>
      </div>
    </div>
  );
}

function TotalSummary({ fodderData, totalKg, winterDays }) {
  const totalNeeded = fodderData.reduce((s, a) => s + a.needed, 0);
  const allSufficient = totalKg >= totalNeeded;
  const overallPct = Math.min(100, Math.round((totalKg / totalNeeded) * 100));

  return (
    <div className={`rounded-2xl p-5 border-2 ${allSufficient ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
      <div className="flex items-center gap-3 mb-4">
        <Wheat className={`w-6 h-6 ${allSufficient ? "text-green-600" : "text-red-600"}`} />
        <h4 className={`font-bold text-lg ${allSufficient ? "text-green-800" : "text-red-800"}`}>
          {allSufficient
            ? "✅ Корма достаточно для всего поголовья"
            : "⚠️ Корма недостаточно — требуется докупка"
          }
        </h4>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Всего доступно</p>
          <p className="font-bold text-gray-900">{(totalKg / 1000).toFixed(2)} т</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Всего нужно</p>
          <p className="font-bold text-gray-900">{(totalNeeded / 1000).toFixed(2)} т</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Обеспеченность</p>
          <p className={`font-bold ${allSufficient ? "text-green-600" : "text-red-600"}`}>{overallPct}%</p>
        </div>
      </div>
      {!allSufficient && (
        <div className="bg-red-100 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700 font-medium">
            Дефицит: {((totalNeeded - totalKg) / 1000).toFixed(2)} тонн — рекомендуется заготовить дополнительный корм или сократить поголовье.
          </p>
        </div>
      )}
    </div>
  );
}

function CalcInput({ label, value, onChange, suffix }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <input
          type="number" min="0" value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="flex-1 text-sm font-semibold text-gray-900 focus:outline-none w-0 min-w-0"
        />
        <span className="text-sm text-gray-400 flex-shrink-0">{suffix}</span>
      </div>
    </div>
  );
}

// ── Базовые sub-компоненты (без изменений) ────────────────────────────────────

function Stat({ icon, value, label }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-xl">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function ResultCell({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PastureInfo({ pasture }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Пастбище</label>
      <div className="p-3 bg-gray-50 rounded-xl">
        <p className="font-medium text-gray-900">{pasture.name}</p>
        <p className="text-sm text-gray-600">{pasture.area} га</p>
      </div>
    </div>
  );
}

function DescriptionField({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Описание (опционально)</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        rows={3} placeholder="Добавьте комментарий..." />
    </div>
  );
}

function ModalButtons({ onCancel, submitting, disabled, submitLabel, submitColor, icon }) {
  return (
    <div className="flex gap-3 pt-4">
      <button type="submit" disabled={submitting || disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitColor}`}>
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Обработка...</> : <>{icon} {submitLabel}</>}
      </button>
      <button type="button" onClick={onCancel} disabled={submitting}
        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50">
        Отмена
      </button>
    </div>
  );
}