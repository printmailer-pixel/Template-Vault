import React, { useState, useEffect, useMemo } from 'react';
import { Template, SearchTab, SyncSettings } from './types';
import { fetchSheetTemplates, getLocalTemplates, saveLocalTemplates, classNames, getSyncSettings, saveSyncSettings } from './utils';
import { TemplateCard } from './components/TemplateCard';
import { AddEditModal } from './components/AddEditModal';
import { SendModal } from './components/SendModal';
import { SettingsModal } from './components/SettingsModal';
import { Search, Plus, Loader2, Check, Settings, AlertCircle, Shield, Key } from 'lucide-react';

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('Title');
  
  // Settings sync state
  const [settings, setSettings] = useState<SyncSettings>(getSyncSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeGmail, setActiveGmail] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [sendModalState, setSendModalState] = useState<{ isOpen: boolean; template: Template | null; method: 'whatsapp' | 'email' | 'sms' }>({
    isOpen: false,
    template: null,
    method: 'whatsapp'
  });

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    loadData(settings);
  }, []);

  const loadData = async (currentSettings: SyncSettings) => {
    setLoading(true);
    setSyncError(null);
    try {
      const result = await fetchSheetTemplates(currentSettings);
      const localTemplates = getLocalTemplates();
      setTemplates([...localTemplates, ...result.templates]);
      if (result.email) {
        setActiveGmail(result.email);
      } else {
        setActiveGmail(null);
      }
      if (result.error) {
        setSyncError(result.error);
      }
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
      setSyncError(error?.message || 'An unexpected error occurred during templates synchronization.');
      setTemplates(getLocalTemplates());
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Copied!');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSaveTemplate = (template: Template) => {
    setTemplates(prev => {
      const isExisting = prev.some(t => t.id === template.id);
      let newTemplates;
      if (isExisting) {
        newTemplates = prev.map(t => t.id === template.id ? template : t);
      } else {
        newTemplates = [template, ...prev];
      }
      saveLocalTemplates(newTemplates);
      return newTemplates;
    });
    setIsAddEditModalOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => {
        const newTemplates = prev.filter(t => t.id !== id);
        saveLocalTemplates(newTemplates);
        return newTemplates;
      });
    }
  };

  const openSendModal = (template: Template, method: 'whatsapp' | 'email' | 'sms') => {
    setSendModalState({ isOpen: true, template, method });
  };

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    
    return templates.filter(template => {
      if (searchTab === 'Title') {
        return template.title.toLowerCase().includes(query);
      } else if (searchTab === 'Subject') {
        return template.subject.toLowerCase().includes(query);
      } else {
        return template.message.toLowerCase().includes(query);
      }
    });
  }, [templates, searchQuery, searchTab]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex justify-center w-full">
      <div className="w-full max-w-2xl bg-[#F8FAFC] flex flex-col min-h-screen relative shadow-sm">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">RE-Vault <span className="text-sm font-normal text-slate-400 ml-1">v1.5</span></h1>
          </div>
          <div className="flex items-center space-x-2">
            {settings.mode === 'private' && (
              <div className="hidden sm:flex items-center space-x-1 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-700 max-w-[150px]">
                <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{activeGmail || 'Authorized'}</span>
              </div>
            )}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              title="Access & Sync Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="hidden md:flex text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">{templates.length}</div>
          </div>
        </header>

        {/* Search & Filter Controls */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 shrink-0 shadow-sm sticky top-[72px] z-20">
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
              {(['Title', 'Subject', 'Message'] as SearchTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSearchTab(tab)}
                  className={classNames(
                    "flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                    searchTab === tab 
                      ? "bg-white text-indigo-600 shadow-sm font-bold" 
                      : "text-slate-500 hover:text-slate-700 font-semibold"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg"
                placeholder={`Search within ${searchTab.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow pb-24 animate-fade-in">
          
          {/* Active Error Notice */}
          {syncError && (
            <div className="mb-4 p-4 border border-rose-100 bg-rose-50/60 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-grow space-y-2">
                <div className="text-xs font-bold text-rose-800 uppercase tracking-wide">Secure sync failure</div>
                <p className="text-xs text-rose-700 leading-relaxed whitespace-pre-line">{syncError}</p>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="text-xs font-bold text-slate-700 hover:bg-slate-200 inline-flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <span>Configure Connection settings</span>
                  </button>
                  {settings.mode === 'private' && settings.webAppUrl && (
                    <a
                      href={settings.webAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 px-3 py-1.5 rounded-lg inline-flex items-center space-x-1"
                    >
                      <span>Authorize Google Connection</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading Vault...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No templates found.</p>
              <p className="text-sm mt-1">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCopy={handleCopy}
                  onEdit={t => {
                    setEditingTemplate(t);
                    setIsAddEditModalOpen(true);
                  }}
                  onDelete={handleDeleteTemplate}
                  onSend={openSendModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => {
            setEditingTemplate(null);
            setIsAddEditModalOpen(true);
          }}
          className="fixed bottom-6 right-6 md:absolute w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-transform active:scale-95 z-40"
          aria-label="Add Template"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Modals */}
        <AddEditModal
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
          editingTemplate={editingTemplate}
        />

        <SendModal
          isOpen={sendModalState.isOpen}
          onClose={() => setSendModalState(prev => ({ ...prev, isOpen: false }))}
          template={sendModalState.template}
          method={sendModalState.method}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            // Refresh settings in case they updated them
            const fresh = getSyncSettings();
            setSettings(fresh);
            loadData(fresh);
          }}
          settings={settings}
          onSave={(newSettings) => {
            saveSyncSettings(newSettings);
            setSettings(newSettings);
            loadData(newSettings);
          }}
        />

        {/* Toast Notification */}
        <div
          className={classNames(
            "fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all duration-300 z-50",
            toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>

      </div>
    </div>
  );
}

