import React, { useState, useRef } from 'react';
import {
  StudioContentBank,
  CloudSyncConfig,
  MasterLiveState,
} from '../../../types/masterStudio';
import {
  downloadMasterTemplateFile,
  exportContentBankWorkbook,
  parseExcelContentBank,
  mergeContentBank,
  countTotalBankItems,
  getDefaultContentBank,
  ParseResult,
} from '../../../utils/excelContentEngine';
import {
  saveContentBankLocally,
  saveCloudConfig,
  syncContentBankToSupabase,
  fetchContentBankFromSupabase,
  fetchContentBankFromGoogleSheets,
} from '../../../utils/cloudSyncService';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Database,
  Link as LinkIcon,
  HardDrive,
  Sparkles,
  Info,
  Check,
  FileDown,
} from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface ExcelCloudManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBank?: StudioContentBank;
  contentBank?: StudioContentBank;
  onUpdateContentBank: (newBank: StudioContentBank) => void;
  cloudConfig: CloudSyncConfig;
  onUpdateCloudConfig?: (newConfig: CloudSyncConfig) => void;
  onSaveCloudConfig?: (newConfig: CloudSyncConfig) => void;
}

export const ExcelCloudManagerModal: React.FC<ExcelCloudManagerModalProps> = ({
  isOpen,
  onClose,
  currentBank: propCurrentBank,
  contentBank,
  onUpdateContentBank,
  cloudConfig,
  onUpdateCloudConfig: propOnUpdateCloudConfig,
  onSaveCloudConfig,
}) => {
  const currentBank = contentBank || propCurrentBank || getDefaultContentBank();
  const onUpdateCloudConfig = onSaveCloudConfig || propOnUpdateCloudConfig || (() => {});
  const [activeTab, setActiveTab] = useState<'excel' | 'cloud' | 'backup'>('excel');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ParseResult | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states for Cloud config
  const [supabaseUrl, setSupabaseUrl] = useState(cloudConfig.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(cloudConfig.supabaseAnonKey || '');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(cloudConfig.googleSheetsUrl || '');
  const [googleSheetsAutoSync, setGoogleSheetsAutoSync] = useState(cloudConfig.googleSheetsAutoSync || false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Manejo de archivo Excel / CSV
  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelContentBank(buffer);

      if (Object.keys(result.counts).length === 0) {
        showToast('No se encontraron hojas válidas ni filas reconocidas en el archivo.', 'error');
        setIsProcessing(false);
        return;
      }

      setLastImportResult(result);
      const updatedBank = mergeContentBank(currentBank, result.bank, importMode);

      onUpdateContentBank(updatedBank);
      saveContentBankLocally(updatedBank);

      // Si Supabase está conectado, auto-guardar en la nube
      if (cloudConfig.supabaseUrl && cloudConfig.supabaseAnonKey) {
        syncContentBankToSupabase(cloudConfig, updatedBank).catch((e) =>
          console.warn('Auto cloud sync background notice:', e)
        );
      }

      studioAudio.playCorrect();
      showToast(`¡Excel importado con éxito! Se actualizaron ${Object.keys(result.counts).length} juegos.`, 'success');
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      showToast(`Error al procesar el archivo Excel: ${err.message || 'Formato no soportado'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // 2. Acciones en la Nube
  const handleSaveCloudSettings = () => {
    const updated: CloudSyncConfig = {
      ...cloudConfig,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      googleSheetsUrl: googleSheetsUrl.trim(),
      googleSheetsAutoSync,
    };
    onUpdateCloudConfig(updated);
    saveCloudConfig(updated);
    showToast('Configuración de nube guardada.', 'info');
  };

  const handlePushToSupabase = async () => {
    setIsProcessing(true);
    const updatedConfig: CloudSyncConfig = {
      ...cloudConfig,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    };
    const res = await syncContentBankToSupabase(updatedConfig, currentBank);
    setIsProcessing(false);

    if (res.success) {
      studioAudio.playFanfare();
      showToast(res.message, 'success');
      onUpdateCloudConfig({
        ...updatedConfig,
        supabaseConnected: true,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });
      saveCloudConfig({
        ...updatedConfig,
        supabaseConnected: true,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });
    } else {
      studioAudio.playError();
      showToast(res.message, 'error');
    }
  };

  const handlePullFromSupabase = async () => {
    setIsProcessing(true);
    const updatedConfig: CloudSyncConfig = {
      ...cloudConfig,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
    };
    const res = await fetchContentBankFromSupabase(updatedConfig);
    setIsProcessing(false);

    if (res.success && res.bank) {
      studioAudio.playCorrect();
      onUpdateContentBank(res.bank);
      saveContentBankLocally(res.bank);
      showToast(res.message, 'success');
      onUpdateCloudConfig({
        ...updatedConfig,
        supabaseConnected: true,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });
      saveCloudConfig({
        ...updatedConfig,
        supabaseConnected: true,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });
    } else {
      studioAudio.playError();
      showToast(res.message, 'error');
    }
  };

  const handleFetchGoogleSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      showToast('Ingresa el enlace de Google Sheets primero.', 'error');
      return;
    }

    setIsProcessing(true);
    const res = await fetchContentBankFromGoogleSheets(googleSheetsUrl.trim());
    setIsProcessing(false);

    if (res.success && res.bank) {
      const merged = mergeContentBank(currentBank, res.bank, importMode);
      onUpdateContentBank(merged);
      saveContentBankLocally(merged);
      studioAudio.playFanfare();
      showToast(`¡Google Sheets sincronizado! ${Object.keys(res.counts || {}).length} juegos actualizados.`, 'success');

      // Update config
      const updatedConfig: CloudSyncConfig = {
        ...cloudConfig,
        googleSheetsUrl: googleSheetsUrl.trim(),
        googleSheetsAutoSync,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      };
      onUpdateCloudConfig(updatedConfig);
      saveCloudConfig(updatedConfig);
    } else {
      studioAudio.playError();
      showToast(res.message, 'error');
    }
  };

  // 3. Copiar código Hardcode
  const handleCopyHardcode = () => {
    const jsonString = JSON.stringify(currentBank, null, 2);
    const codeSnippet = `// Copia este objeto en src/utils/gameData.ts para dejarlo grabado de fábrica:\nexport const CUSTOM_PRELOADED_BANK = ${jsonString};`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeSnippet).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = codeSnippet;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        });
      }
    } catch {
      // ignore
    }
    setCopiedCode(true);
    studioAudio.playWheelClick();
    setTimeout(() => setCopiedCode(false), 3000);
    showToast('¡Código JSON copiado al portapapeles! Listo para pegar en el código.', 'success');
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(currentBank, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Studio_ContentBank_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDefaults = () => {
    const defaults = getDefaultContentBank();
    onUpdateContentBank(defaults);
    saveContentBankLocally(defaults);
    studioAudio.playTurnChange();
    showToast('Banco restaurado a los valores predeterminados de fábrica.', 'info');
  };

  const totalItemsCount = countTotalBankItems(currentBank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[90vh] max-h-[850px] w-full max-w-4xl flex-col rounded-3xl border-2 border-slate-700 bg-slate-950 text-white shadow-2xl overflow-hidden">
        {/* Header del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md">
              <FileSpreadsheet className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-scoreboard text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Gestor Excel & Persistencia en la Nube
              </h2>
              <p className="text-xs text-slate-400">
                Guarda palabras, canciones, preguntas y sorteos en cualquier computadora o dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Navegación de Pestañas */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/40 px-5 gap-2">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-black uppercase transition-all ${
              activeTab === 'excel'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>1. Importar / Exportar Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-black uppercase transition-all ${
              activeTab === 'cloud'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-4 w-4" />
            <span>2. Conexión en la Nube Multi-Dispositivo</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-black uppercase transition-all ${
              activeTab === 'backup'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>3. Respaldo Local & Código</span>
          </button>

          {/* Contador de reactivos guardados */}
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-mono font-bold text-slate-300">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>{totalItemsCount} reactivos guardados</span>
          </div>
        </div>

        {/* Notificación Toast Flotante */}
        {toastMessage && (
          <div
            className={`mx-5 mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg animate-fadeIn ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950 border border-red-500/60 text-red-200'
                : 'bg-blue-950 border border-blue-500/60 text-blue-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Contenido Principal de Pestañas con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* PESTAÑA 1: IMPORTAR / EXPORTAR EXCEL                      */}
          {/* ========================================================= */}
          {activeTab === 'excel' && (
            <div className="space-y-6">
              {/* Sección Descargar Plantilla */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Paso 1: Obtén la Plantilla Oficial
                    </span>
                    <h3 className="font-scoreboard text-lg font-black text-white">
                      Plantilla Maestra de Excel (.xlsx) Multi-Pestaña
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Descarga el archivo que contiene <strong>9 hojas organizadas</strong> con columnas exactas y ejemplos:
                      Biblia, Citas, Ahorcado, Charadas, 100 Dijeron, Trivia y Millonario, Anagrama, Música & Karaoke y Sorteos.
                    </p>
                  </div>

                  <button
                    onClick={() => downloadMasterTemplateFile()}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-scoreboard text-xs font-black uppercase px-4 py-3 shadow-lg shadow-emerald-500/25 active:scale-95 shrink-0"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>📥 Descargar Plantilla (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Sección Subida Drag & Drop */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Paso 2: Cargar tu Archivo Excel o CSV
                  </span>

                  {/* Modo de importación: Reemplazar vs Sumar */}
                  <div className="flex items-center gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                    <button
                      onClick={() => setImportMode('replace')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        importMode === 'replace'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔄 Reemplazar banco actual
                    </button>
                    <button
                      onClick={() => setImportMode('append')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        importMode === 'append'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ➕ Sumar a los existentes
                    </button>
                  </div>
                </div>

                {/* Zona de Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
                      : 'border-slate-700 bg-slate-950/50 hover:border-slate-500 hover:bg-slate-900/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-emerald-400 mb-2 animate-bounce" />
                  <span className="font-scoreboard text-base font-black text-white">
                    Arrastra aquí tu archivo Excel (.xlsx / .csv) o haz clic para explorar
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Lee automáticamente las 9 hojas del archivo y las carga al estudio en vivo al instante.
                  </p>
                </div>
              </div>

              {/* Resumen de Última Importación */}
              {lastImportResult && Object.keys(lastImportResult.counts).length > 0 && (
                <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Última Importación Exitosa:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(lastImportResult.counts).map(([name, count]) => (
                      <span
                        key={name}
                        className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300"
                      >
                        {name}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Exportar Banco Actual */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => exportContentBankWorkbook(currentBank)}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-bold transition-all shadow"
                >
                  <FileDown className="h-4 w-4 text-emerald-400" />
                  <span>Exportar Todo Mi Banco Actual a Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: CONEXIÓN EN LA NUBE PERMANENTE                  */}
          {/* ========================================================= */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Explicación Multi-Dispositivo */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex items-start gap-3">
                <Cloud className="h-6 w-6 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white text-sm">
                    Sincronización en la Nube: "Disponible donde sea que abras la app"
                  </p>
                  <p>
                    Configura Supabase o un Google Sheets publicado. Cada vez que abras esta aplicación desde cualquier
                    navegador, computadora o smartphone, se cargarán tus preguntas y canciones automáticamente.
                  </p>
                </div>
              </div>

              {/* Opción A: Supabase Cloud Database */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-scoreboard text-sm font-black uppercase text-white">
                      Opción A: Supabase Cloud Store (Lectura y Escritura Automática)
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      cloudConfig.supabaseConnected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cloudConfig.supabaseConnected ? '● Conectado' : 'Sin Conectar'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Supabase Project URL</label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Supabase Anon Public Key</label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={handleSaveCloudSettings}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-bold"
                  >
                    Guardar Credenciales
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePushToSupabase}
                      disabled={isProcessing || !supabaseUrl || !supabaseAnonKey}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold uppercase transition-all shadow disabled:opacity-40"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>⬆️ Guardar en Supabase</span>
                    </button>
                    <button
                      onClick={handlePullFromSupabase}
                      disabled={isProcessing || !supabaseUrl || !supabaseAnonKey}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold uppercase transition-all shadow disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>⬇️ Descargar de Supabase</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">💡 SQL para crear la tabla en Supabase (SQL Editor):</p>
                  <code className="block rounded bg-slate-900 p-2 font-mono text-[10px] text-emerald-400 select-all">
                    CREATE TABLE IF NOT EXISTS studio_content_bank (id text primary key, data jsonb, updated_at timestamptz);
                  </code>
                </div>
              </div>

              {/* Opción B: Vínculo Vivo con Google Sheets */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-amber-400" />
                    <h3 className="font-scoreboard text-sm font-black uppercase text-white">
                      Opción B: Vínculo Vivo con Google Sheets (Publicado en la Web)
                    </h3>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Enlace de tu Hoja de Google Sheets
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleFetchGoogleSheets}
                      disabled={isProcessing || !googleSheetsUrl}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-black uppercase shadow transition-all disabled:opacity-40"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Cargar Ahora</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoSyncGoogle"
                    checked={googleSheetsAutoSync}
                    onChange={(e) => {
                      setGoogleSheetsAutoSync(e.target.checked);
                      handleSaveCloudSettings();
                    }}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="autoSyncGoogle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Cargar automáticamente esta hoja de Google Sheets cada vez que abra la aplicación
                  </label>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">¿Cómo publicar tu hoja de Google Sheets?:</span> En Google Sheets ve a <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong> y haz clic en Publicar. Luego copia el enlace de tu navegador.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: RESPALDO LOCAL & CÓDIGO FUENTE                  */}
          {/* ========================================================= */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Generador de Hardcode */}
              <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>Grabado Permanente en Código Fuente (Hardcode Backup)</span>
                </div>
                <h3 className="font-scoreboard text-base font-black text-white">
                  ¿Quieres que tus datos de Excel queden grabados de fábrica dentro de la app?
                </h3>
                <p className="text-xs text-slate-300">
                  Haz clic en el botón a continuación para copiar al portapapeles todo el contenido actual (las 10 dinámicas y sorteos)
                  en formato JSON listo para ser integrado en el código del servidor o en Google AI Studio.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleCopyHardcode}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-scoreboard text-xs font-black uppercase px-4 py-2.5 shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-950" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedCode ? '¡Copiado al Portapapeles!' : '💾 Copiar Código con Mis Datos'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-bold transition-all"
                  >
                    <Download className="h-4 w-4 text-amber-400" />
                    <span>Descargar Archivo JSON de Respaldo</span>
                  </button>
                </div>
              </div>

              {/* Detalle del banco actual */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-scoreboard text-xs font-bold uppercase tracking-wider text-slate-400">
                    Inventario de Reactivos Activos en Memoria
                  </span>
                  <button
                    onClick={handleResetDefaults}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300"
                  >
                    Restaurar Banco de Fábrica
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">1. ¿En qué libro está?</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.bibleBookItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">2. ¿Quién lo dijo?</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.whoSaidItItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">3. Ahorcado Pro</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.hangmanItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">4. Charadas</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.charadesItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">5. 100 Personas Dijeron</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.familyFeudItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">6. Trivia Show 50:50</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.triviaShowItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">7. Anagrama & Ruleta</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.anagramItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">8. Música & Karaoke</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.musicItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">9. Millonario Show</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.millionaireItems.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">10. Trato Hecho</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.briefcases.length}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sorteos & Rifas</span>
                    <strong className="text-lg text-white font-mono font-black">{currentBank.raffleParticipants.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cloud className="h-4 w-4 text-emerald-400" />
            <span>
              {cloudConfig.lastSyncTimestamp
                ? `Última sincronización: ${new Date(cloudConfig.lastSyncTimestamp).toLocaleTimeString()}`
                : 'Sin sincronizaciones registradas aún'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 text-xs font-bold uppercase transition-all"
          >
            Cerrar Gestor
          </button>
        </div>
      </div>
    </div>
  );
};
