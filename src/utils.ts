import Papa from 'papaparse';
import { Template } from './types';
import { v4 as uuidv4 } from 'uuid';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1Vy9qllpHUAUxL-23HQIKU4rdy0rftt8P7wQdQJUVp0Y/export?format=csv&gid=0';

export async function fetchSheetTemplates(): Promise<Template[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
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
        }).filter(t => t.title || t.subject || t.message);
        resolve(templates);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        resolve([]); // Fallback to empty array on error
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
