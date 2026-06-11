import Papa from 'papaparse';
import { Template, SyncSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Vy9qllpHUAUxL-23HQIKU4rdy0rftt8P7wQdQJUVp0Y/export?format=csv&gid=0';

export const DEFAULT_SETTINGS: SyncSettings = {
  mode: 'public',
  publicCsvUrl: DEFAULT_CSV_URL,
  webAppUrl: ''
};

export function getSyncSettings(): SyncSettings {
  try {
    const data = localStorage.getItem('sync_settings');
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSyncSettings(settings: SyncSettings) {
  localStorage.setItem('sync_settings', JSON.stringify(settings));
}

export async function fetchSheetTemplates(settings: SyncSettings): Promise<{ templates: Template[]; email?: string; error?: string }> {
  if (settings.mode === 'private') {
    if (!settings.webAppUrl) {
      return { templates: [], error: 'Secure Web App URL is not set. Please configure it in settings.' };
    }
    try {
      const response = await fetch(settings.webAppUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        return { 
          templates: result.templates || [], 
          email: result.email || undefined 
        };
      } else {
        return { 
          templates: [], 
          error: result.error || 'The Web App returned an authorization or execution error.' 
        };
      }
    } catch (error: any) {
      console.error("Error fetching via Web App:", error);
      return {
        templates: [],
        error: `Secure browser access blocked. Please make sure: \n1. Your Google Account has access to the spreadsheet under "Share".\n2. You click "Authorize" in settings to grant browser permissions once.`
      };
    }
  }

  return new Promise((resolve) => {
    Papa.parse(settings.publicCsvUrl || DEFAULT_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const templates: Template[] = results.data.map((row: any, index: number) => {
          const keys = Object.keys(row);
          const titleKey = keys.find(k => k.toLowerCase().includes('title')) || keys[0];
          const subjectKey = keys.find(k => k.toLowerCase().includes('subject')) || keys[1];
          const messageKey = keys.find(k => k.toLowerCase().includes('message') || k.toLowerCase().includes('mesage')) || keys[2];

          return {
            id: `sheet-${index}`,
            title: row[titleKey]?.trim() || '',
            subject: row[subjectKey]?.trim() || '',
            message: row[messageKey]?.trim() || '',
            source: 'sheet' as const
          };
        }).filter(t => t.title);
        resolve({ templates });
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        resolve({ templates: [], error: 'Could not fetch public CSV. Make sure the spreadsheet link is open to "anyone with link can view".' });
      }
    });
  });
}

export function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getLocalTemplates(): Template[] {
  try {
    const data = localStorage.getItem('local_templates');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalTemplates(templates: Template[]) {
  localStorage.setItem('local_templates', JSON.stringify(templates.filter(t => t.source === 'local')));
}

