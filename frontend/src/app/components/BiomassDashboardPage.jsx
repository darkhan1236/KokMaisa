// src/app/components/BiomassDashboardPage.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/app/components/Header";
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Wheat,
  Droplets,
  Sun,
  Target,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function BiomassDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPasture, setSelectedPasture] = useState("all");

  // Все хуки ПЕРЕД проверкой авторизации
  const pastures = user?.profile?.pastures || [];

  const monthlyData = [
    { month: t('months.jan'), biomass: 1200, rainfall: 45, temperature: -5 },
    { month: t('months.feb'), biomass: 1100, rainfall: 38, temperature: -3 },
    { month: t('months.mar'), biomass: 1400, rainfall: 52, temperature: 5 },
    { month: t('months.apr'), biomass: 1800, rainfall: 68, temperature: 12 },
    { month: t('months.may'), biomass: 2400, rainfall: 75, temperature: 18 },
    { month: t('months.jun'), biomass: 2800, rainfall: 62, temperature: 24 },
    { month: t('months.jul'), biomass: 2600, rainfall: 48, temperature: 28 },
    { month: t('months.aug'), biomass: 2300, rainfall: 42, temperature: 26 },
    { month: t('months.sep'), biomass: 2000, rainfall: 55, temperature: 18 },
    { month: t('months.oct'), biomass: 1600, rainfall: 48, temperature: 10 },
    { month: t('months.nov'), biomass: 1300, rainfall: 42, temperature: 2 },
    { month: t('months.dec'), biomass: 1150, rainfall: 40, temperature: -4 },
  ];

  const weeklyData = [
    { week: t('biomass.week1'), biomass: 2450, optimal: 2500 },
    { week: t('biomass.week2'), biomass: 2520, optimal: 2500 },
    { week: t('biomass.week3'), biomass: 2380, optimal: 2500 },
    { week: t('biomass.week4'), biomass: 2600, optimal: 2500 },
  ];

  const pastureComparison = useMemo(() => {
    return pastures.length > 0
      ? pastures.map((p) => ({
          name: p.name?.substring(0, 15) || t('biomass.pasture'),
          biomass: p.biomassEstimate || Math.floor(Math.random() * 1500) + 1500,
          area: parseFloat(p.area) || 50,
        }))
      : [
          { name: t('biomass.northField'), biomass: 2400, area: 120 },
          { name: t('biomass.eastSlope'), biomass: 1800, area: 85 },
          { name: t('biomass.riverValley'), biomass: 2800, area: 200 },
          { name: t('biomass.hillyPasture'), biomass: 2100, area: 150 },
        ];
  }, [pastures, t]);

  const grassTypeDistribution = [
    { name: t('pastures.grassTypes.alfalfa'), value: 35, color: "#22c55e" },
    { name: t('pastures.grassTypes.clover'), value: 25, color: "#16a34a" },
    { name: t('pastures.grassTypes.timothy'), value: 20, color: "#15803d" },
    { name: t('pastures.grassTypes.fescue'), value: 15, color: "#166534" },
    { name: t('pastures.grassTypes.mixed'), value: 5, color: "#14532d" },
  ];

  const healthIndicators = [
    {
      label: "NDVI " + t('biomass.index'),
      value: 0.72,
      status: "good",
      description: t('biomass.highVegetation'),
    },
    {
      label: t('biomass.soilMoisture'),
      value: 45,
      unit: "%",
      status: "warning",
      description: t('biomass.irrigationNeeded'),
    },
    {
      label: t('biomass.coverDensity'),
      value: 85,
      unit: "%",
      status: "good",
      description: t('biomass.excellentCoverage'),
    },
    {
      label: t('biomass.grassHeight'),
      value: 28,
      unit: " cm",
      status: "good",
      description: t('biomass.optimalHeight'),
    },
  ];

  const alerts = [
    {
      id: 1,
      type: "warning",
      title: t('biomass.lowBiomass'),
      description: t('biomass.eastSlopeAttention'),
      date: t('biomass.today'),
    },
    {
      id: 2,
      type: "info",
      title: t('biomass.optimalGrazing'),
      description: t('biomass.riverValleyRecommended'),
      date: t('biomass.yesterday'),
    },
    {
      id: 3,
      type: "success",
      title: t('biomass.analysisComplete'),
      description: t('biomass.allPasturesAnalyzed'),
      date: t('biomass.twoDaysAgo'),
    },
  ];

  const totalBiomass = useMemo(
    () => pastureComparison.reduce((acc, p) => acc + p.biomass, 0),
    [pastureComparison]
  );

  const avgBiomass = useMemo(
    () => Math.round(totalBiomass / pastureComparison.length),
    [totalBiomass, pastureComparison.length]
  );

  const totalArea = useMemo(
    () => pastureComparison.reduce((acc, p) => acc + p.area, 0),
    [pastureComparison]
  );

  const periods = [
    { value: "week", label: t('common.week') },
    { value: "month", label: t('common.month') },
    { value: "year", label: t('common.year') },
  ];

  // Проверка авторизации ПОСЛЕ всех хуков
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('common.pleaseLogin')}
          </p>
          <Button onClick={() => navigate("/login")}>{t('nav.login')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M54.627%200l.83.828-1.415%201.415L51.8%200h2.827zM5.373%200l-.83.828L5.96%202.243%208.2%200H5.374zM48.97%200l3.657%203.657-1.414%201.414L46.143%200h2.828zM11.03%200L7.372%203.657%208.787%205.07%2013.857%200H11.03zm32.284%200L49.8%206.485%2048.384%207.9l-7.9-7.9h2.83zM16.686%200L10.2%206.485%2011.616%207.9l7.9-7.9h-2.83zM22.344%200L13.858%208.485%2015.272%209.9l9.9-9.9h-2.828zM32%200l-3.486%203.485%201.415%201.415L34.343%200H32z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22/%3E%3C/svg%3E')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('biomass.title')}
              </h1>
              <p className="text-white/80">
                {t('biomass.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={
                    selectedPeriod === period.value
                      ? "bg-white text-green-600"
                      : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                  }
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('biomass.avgBiomass')}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {avgBiomass} {t('biomass.unit')}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+12%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('biomass.totalArea')}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalArea} {t('common.hectares')}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {pastureComparison.length} {t('biomass.plots')}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('biomass.health')}</p>
                  <p className="text-2xl font-bold text-foreground">87%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">{t('pastures.rating.good')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('biomass.forecast')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    +8% {t('biomass.nextMonth')}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary">{t('biomass.growth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Biomass Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('biomass.biomassTrend')}</CardTitle>
              <CardDescription>
                {t('biomass.trendDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="biomassGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="biomass"
                      name={t('biomass.biomassName')}
                      stroke="#22c55e"
                      fill="url(#biomassGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rainfall"
                      name={t('biomass.rainfall')}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('biomass.weeklyTrend')}</CardTitle>
              <CardDescription>{t('biomass.weeklyComparison')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="biomass"
                      name={t('biomass.actual')}
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="optimal"
                      name={t('biomass.optimal')}
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pasture Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('biomass.pastureComparison')}</CardTitle>
              <CardDescription>{t('biomass.pastureComparison')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pastureComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="biomass"
                      name={t('biomass.biomassName')}
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grass Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('biomass.grassTypes')}</CardTitle>
              <CardDescription>{t('biomass.distribution')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={grassTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {grassTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {grassTypeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Indicators */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('biomass.healthIndicators')}</CardTitle>
              <CardDescription>{t('biomass.keyMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {healthIndicators.map((indicator) => (
                  <div
                    key={indicator.label}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {indicator.label}
                      </span>
                      {indicator.status === "good" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : indicator.status === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {indicator.value}
                      {indicator.unit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {indicator.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>{t('biomass.notifications')}</CardTitle>
              <CardDescription>{t('biomass.recentEvents')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        alert.type === "warning"
                          ? "bg-amber-100"
                          : alert.type === "success"
                            ? "bg-green-100"
                            : "bg-blue-100"
                      }`}
                    >
                      {alert.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : alert.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                {t('biomass.allNotifications')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}