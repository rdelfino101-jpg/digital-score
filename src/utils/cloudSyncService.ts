import { StudioContentBank, CloudSyncConfig } from '../types/masterStudio';
import { parseExcelContentBank } from './excelContentEngine';

export const LOCAL_BANK_STORAGE_KEY = 'master_studio_content_bank_v1';
export const CLOUD_CONFIG_STORAGE_KEY = 'master_studio_cloud_config_v1';

export const DEFAULT_CLOUD_CONFIG: CloudSyncConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseConnected: false,
  googleSheetsUrl: '',
  googleSheetsAutoSync: false,
  lastSyncTimestamp: null,
  lastSyncStatus: 'idle',
  lastSyncMessage: 'Listo para sincronizar.',
};

/**
 * Saves content bank to browser localStorage for offline durability.
 */
export function saveContentBankLocally(bank: StudioContentBank): void {
  try {
    localStorage.setItem(LOCAL_BANK_STORAGE_KEY, JSON.stringify(bank));
  } catch (err) {
    console.warn('Could not save content bank locally:', err);
  }
}

/**
 * Loads content bank from browser localStorage.
 */
export function loadContentBankLocally(): StudioContentBank | null {
  try {
    const raw = localStorage.getItem(LOCAL_BANK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudioContentBank;
  } catch (err) {
    console.warn('Could not load content bank locally:', err);
    return null;
  }
}

/**
 * Saves cloud sync preferences in localStorage.
 */
export function saveCloudConfig(config: CloudSyncConfig): void {
  try {
    localStorage.setItem(CLOUD_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not save cloud config:', err);
  }
}

/**
 * Loads cloud sync preferences from localStorage.
 */
export function loadCloudConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CLOUD_CONFIG };
    return { ...DEFAULT_CLOUD_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CLOUD_CONFIG };
  }
}

/**
 * Converts a standard Google Sheets sharing/edit URL into an open XLSX export endpoint.
 */
export function normalizeGoogleSheetsUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // If already an export URL
  if (trimmed.includes('export?format=')) return trimmed;

  // Extract /d/{spreadsheetId}/
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (match && match[1]) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  }

  return trimmed;
}

/**
 * Fetches and parses an online Google Sheet (.xlsx) directly into the app.
 */
export async function fetchContentBankFromGoogleSheets(
  rawUrl: string
): Promise<{ success: boolean; bank?: Partial<StudioContentBank>; counts?: Record<string, number>; message: string }> {
  const exportUrl = normalizeGoogleSheetsUrl(rawUrl);
  if (!exportUrl) {
    return { success: false, message: 'URL de Google Sheets vacía o inválida.' };
  }

  try {
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Asegúrate de que la hoja esté publicada en la web (Archivo > Compartir > Publicar en la web).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const result = parseExcelContentBank(arrayBuffer);

    return {
      success: true,
      bank: result.bank,
      counts: result.counts,
      message: 'Hoja de Google Sheets descargada y procesada con éxito.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al conectar con Google Sheets.',
    };
  }
}

/**
 * Pushes the entire StudioContentBank to Supabase Cloud Database via direct PostgREST REST API.
 */
export async function syncContentBankToSupabase(
  config: CloudSyncConfig,
  bank: StudioContentBank
): Promise<{ success: boolean; message: string }> {
  const url = (config.supabaseUrl || '').trim().replace(/\/+$/, '');
  const key = (config.supabaseAnonKey || '').trim();

  if (!url || !key) {
    return {
      success: false,
      message: 'Faltan URL y Anon Key de Supabase en la configuración.',
    };
  }

  try {
    const endpoint = `${url}/rest/v1/studio_content_bank?on_conflict=id`;
    const payload = [
      {
        id: 'master_bank',
        data: bank,
        updated_at: new Date().toISOString(),
      },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Informative hint if table doesn't exist
      if (errorText.includes('does not exist') || response.status === 404) {
        throw new Error(
          'La tabla "studio_content_bank" no existe en Supabase. Créala en el SQL Editor con: CREATE TABLE studio_content_bank (id text primary key, data jsonb, updated_at timestamptz);'
        );
      }
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return {
      success: true,
      message: '¡Banco guardado en Supabase Cloud con éxito!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al guardar en Supabase.',
    };
  }
}

/**
 * Fetches the Master Content Bank from Supabase Cloud Database.
 */
export async function fetchContentBankFromSupabase(
  config: CloudSyncConfig
): Promise<{ success: boolean; bank?: StudioContentBank; message: string }> {
  const url = (config.supabaseUrl || '').trim().replace(/\/+$/, '');
  const key = (config.supabaseAnonKey || '').trim();

  if (!url || !key) {
    return {
      success: false,
      message: 'Faltan credenciales de Supabase.',
    };
  }

  try {
    const endpoint = `${url}/rest/v1/studio_content_bank?id=eq.master_bank&select=data,updated_at`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0].data) {
      return {
        success: false,
        message: 'No se encontró un banco "master_bank" en Supabase. Puedes subir uno primero.',
      };
    }

    const bank = data[0].data as StudioContentBank;
    return {
      success: true,
      bank,
      message: '¡Banco descargado desde Supabase Cloud con éxito!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al consultar Supabase.',
    };
  }
}
