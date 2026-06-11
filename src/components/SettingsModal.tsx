import React, { useState } from 'react';
import { SyncSettings } from '../types';
import { X, Key, Shield, HelpCircle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSave: (settings: SyncSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [mode, setMode] = useState<'public' | 'private'>(settings.mode);
  const [publicCsvUrl, setPublicCsvUrl] = useState(settings.publicCsvUrl);
  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      mode,
      publicCsvUrl,
      webAppUrl: webAppUrl.trim(),
    });
    onClose();
  };

  const appsScriptCode = `function doGet(e) {
  try {
    var activeUserEmail = Session.getActiveUser().getEmail();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = sheet.getDataRange().getValues();
    
    var headers = data[0];
    var rows = data.slice(1);
    
    var titleIdx = headers.findIndex(function(h) { return h.toLowerCase().indexOf('title') !== -1; });
    var subjectIdx = headers.findIndex(function(h) { return h.toLowerCase().indexOf('subject') !== -1; });
    var messageIdx = headers.findIndex(function(h) { return h.toLowerCase().indexOf('message') !== -1 || h.toLowerCase().indexOf('mesage') !== -1; });
    
    if (titleIdx === -1) titleIdx = 0;
    if (subjectIdx === -1) subjectIdx = 1;
    if (messageIdx === -1) messageIdx = 2;
    
    var templates = rows.map(function(row, index) {
      return {
        id: 'apps-script-' + index,
        title: (row[titleIdx] || '').toString().trim(),
        subject: (row[subjectIdx] || '').toString().trim(),
        message: (row[messageIdx] || '').toString().trim(),
        source: 'sheet'
      };
    }).filter(function(t) { return t.title; });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      email: activeUserEmail,
      templates: templates
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleTestConnection = async () => {
    if (mode === 'private' && !webAppUrl) {
      setTestResult({ success: false, message: 'Please enter a Apps Script Web App URL first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      if (mode === 'private') {
        const response = await fetch(webAppUrl);
        const data = await response.json();
        if (data.success) {
          setTestResult({ 
            success: true, 
            message: `Connected successfully! Logged in as: ${data.email || 'Authorized Google Session'} (${data.templates.length} templates parsed)` 
          });
        } else {
          setTestResult({ success: false, message: `Access Error: ${data.error}` });
        }
      } else {
        // Test public CSV
        const testUrl = publicCsvUrl || 'https://docs.google.com/spreadsheets/d/1Vy9qllpHUAUxL-23HQIKU4rdy0rftt8P7wQdQJUVp0Y/export?format=csv&gid=0';
        const response = await fetch(testUrl);
        if (response.ok) {
          setTestResult({ success: true, message: 'Connected successfully to Public Sheet!' });
        } else {
          setTestResult({ success: false, message: 'Unable to fetch CSV. Ensure the sheet of public link has viewing permissions.' });
        }
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: mode === 'private' 
          ? "Connection failed. Please ensure the Web App URL is correct, and that your browser is authorized (Click the link below to open and grant access in a new tab)."
          : "Connection failed. Please check the public URL."
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Access Control & Sync Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Vault Access Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setMode('public'); setTestResult(null); }}
                className={`p-4 border rounded-xl text-left transition-all ${
                  mode === 'public'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-bold text-sm mb-1">🔓 Public CSV</div>
                <div className="text-[11px] leading-relaxed opacity-80">Anyone with the direct link can load the spreadsheet. No authorization screens.</div>
              </button>

              <button
                type="button"
                onClick={() => { setMode('private'); setTestResult(null); }}
                className={`p-4 border rounded-xl text-left transition-all ${
                  mode === 'private'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="font-bold text-sm mb-1">🔐 Private & Restricted</div>
                <div className="text-[11px] leading-relaxed opacity-80">Secure browser detection. Requires Google login; access is restricted strictly to shared spreadsheet users.</div>
              </button>
            </div>
          </div>

          {/* Mode Fields */}
          {mode === 'public' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Public CSV URL</label>
                <input
                  type="text"
                  value={publicCsvUrl}
                  onChange={(e) => setPublicCsvUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Spreadsheet must be configured as &quot;Anyone with the link can view&quot;.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Google Apps Script Web App URL</label>
                <input
                  type="text"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Our secure web app interface automatically uses the active browser session!</span>
              </div>

              {/* Step by Step Configuration */}
              <div className="border border-slate-100 rounded-xl bg-slate-50 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>How to deploy (Avoids GCloud / OAuth Setup completely)</span>
                </div>
                <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                  <li>In your Google Sheet, select <b>Extensions &gt; Apps Script</b>.</li>
                  <li>Copy the script below and replace all existing code in the editor.</li>
                  <li>Click <b>Deploy &gt; New Deployment</b>.</li>
                  <li>Set Type to <b>Web App</b>.</li>
                  <li>Set <b>Execute as</b>: <u>User accessing the web app</u>.</li>
                  <li>Set <b>Who has access</b>: <u>Anyone</u>.</li>
                  <li>Copy the deployed Web App URL and paste it above!</li>
                </ol>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apps Script Code</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto max-h-36">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>

              {/* Authorization Tab Helper Link */}
              {webAppUrl && (
                <div className="p-3 border border-orange-100 bg-orange-50/40 rounded-xl text-xs text-orange-800 flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">First Time Browser Authorization</span>
                    <p className="mt-0.5 leading-relaxed">
                      If you see a security block, click the button below to authorize Google to let this application load templates directly through your browser. You only need to do this once.
                    </p>
                    <a
                      href={webAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 mt-2 bg-orange-600 font-bold text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <span>Authorize Google Browser Access</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Test feedback */}
          {testResult && (
            <div className={`p-4 rounded-xl text-xs flex items-start space-x-2 ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              <div className="font-medium leading-relaxed whitespace-pre-line">{testResult.message}</div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center space-x-1.5"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : null}
            <span>Test Connection</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
