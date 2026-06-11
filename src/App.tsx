import React, { useState, useEffect, useMemo } from 'react';
import { Template, SearchTab } from './types';
import { fetchSheetTemplates, getLocalTemplates, saveLocalTemplates, classNames } from './utils';
import { TemplateCard } from './components/TemplateCard';
import { AddEditModal } from './components/AddEditModal';
import { SendModal } from './components/SendModal';
import { Search, Plus, Loader2, Check } from 'lucide-react';

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('Title');
  
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sheetTemplates = await fetchSheetTemplates();
      const localTemplates = getLocalTemplates();
      setTemplates([...localTemplates, ...sheetTemplates]);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
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
            <h1 className="text-xl font-bold tracking-tight text-slate-800">RE-Vault <span className="text-sm font-normal text-slate-400 ml-2">v1.4</span></h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{templates.length} TEMPLATES</div>
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
        <div className="p-4 flex-grow pb-24">
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

