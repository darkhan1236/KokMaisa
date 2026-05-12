// src/app/components/ImageUploadAnalyzer.jsx
// Component for biomass prediction from image upload

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { apiErrorMessage, extractApiDetail } from "@/app/utils/apiErrors";

export default function ImageUploadAnalyzer({ onAnalysisComplete, pastureId }) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    if (!selectedFile.type.startsWith("image/")) {
      setError(apiErrorMessage("unsupported image", i18n));
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError(apiErrorMessage("too large", i18n));
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      if (pastureId) formData.append("pasture_id", pastureId);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("session_expired");
      }

      const response = await fetch("/api/measurements/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(extractApiDetail(data.detail || "analysis failed"));
      }

      const data = await response.json();
      setSuccess(true);
      setFile(null);
      setPreview(null);

      // Call parent callback with analysis results
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(apiErrorMessage(err, i18n));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent" />
          {t("biomass.analyzeImage") || "Analyze Image"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-accent hover:bg-accent-dim"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium text-foreground">
            {t("biomass.dragDrop") || "Drag & drop image here"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("biomass.orClickToSelect") || "or click to select"}
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
            >
              ×
            </button>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              {t("biomass.analyzeSuccess") ||
                "Image analyzed successfully!"}
            </p>
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!file || isLoading}
          className="w-full bg-accent hover:bg-green-600 text-white disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            `${t("biomass.analyzeButton") || "Analyze"}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
