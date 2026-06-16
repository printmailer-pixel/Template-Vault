import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Search, Plus, Loader2, Check, Copy, Edit2, Trash2, MessageSquare, Mail, Smartphone, X } from 'lucide-react';

declare const google: any;

// --- TYPES ---
export interface Template {
  id: string;
  title: string;
  subject: string;
  message: string;
  source: 'sheet' | 'local';
}

export type SearchTab = 'Title' | 'Subject' | 'Message';

// --- UTILS & DATA PROCESSING ---
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1Vy9qllpHUAUxL-23HQIKU4rdy0rftt8P7wQdQJUVp0Y/export?format=csv&gid=0';

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

export async function fetchSheetTemplates(): Promise<Template[]> {
  return new Promise((resolve) => {
    // Check if Google Apps Script environment is available
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((response: string) => {
          try {
            const data = JSON.parse(response);
            if (!Array.isArray(data) || data.length === 0) {
              resolve([]);
              return;
            }
            const headers: string[] = data[0].map((h: string) => String(h).toLowerCase());
            const titleIdx = headers.findIndex(h => h.includes('title')) !== -1 ? headers.findIndex(h => h.includes('title')) : 0;
            const subjectIdx = headers.findIndex(h => h.includes('subject')) !== -1 ? headers.findIndex(h => h.includes('subject')) : 1;
            const messageIdx = headers.findIndex(h => h.includes('message') || h.includes('mesage')) !== -1 ? headers.findIndex(h => h.includes('message') || h.includes('mesage')) : 2;

            const templates: Template[] = [];
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (!row[titleIdx]) continue;
              templates.push({
                id: `sheet-${i}`,
                title: String(row[titleIdx] || '').trim(),
                subject: String(row[subjectIdx] || '').trim(),
                message: String(row[messageIdx] || '').trim(),
                source: 'sheet' as const
              });
            }
            resolve(templates);
          } catch (e) {
            console.error("Error parsing apps script response:", e);
            fetchCSVFallback(resolve);
          }
        })
        .withFailureHandler((error: any) => {
          console.error("Apps script error, falling back to CSV:", error);
          fetchCSVFallback(resolve);
        })
        .getData(); // Using getData as a common App Script function name
    } else {
      // Fallback for non-Apps Script environment
      fetchCSVFallback(resolve);
    }
  });
}

function fetchCSVFallback(resolve: (value: Template[]) => void) {
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
          id: `sheet-csv-${index}`,
          title: row[titleKey]?.trim() || '',
          subject: row[subjectKey]?.trim() || '',
          message: row[messageKey]?.trim() || '',
          source: 'sheet' as const
        };
      }).filter((t: Template) => t.title !== '');
      resolve(templates);
    },
    error: (error: any) => {
      console.error("Error parsing CSV:", error);
      resolve([]); // Fallback to empty array on error
    }
  });
}

// --- COMPONENTS ---

interface TemplateCardProps {
  template: Template;
  onCopy: (text: string) => void;
  onEdit?: (template: Template) => void;
  onDelete?: (id: string) => void;
  onSend: (template: Template, method: 'whatsapp' | 'email' | 'sms') => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onCopy, onEdit, onDelete, onSend }) => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div 
        onClick={() => setExpanded(true)}
        className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all cursor-pointer relative"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1 pr-4 flex-1">
            <span className={classNames(
              "text-[10px] font-bold uppercase tracking-widest block",
              template.source === 'local' ? "text-indigo-500" : "text-emerald-500"
            )}>
              {template.source === 'local' ? 'Custom' : 'Vault'}
            </span>
            {template.subject && (
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Subject: {template.subject}
              </div>
            )}
            <h3 className="text-base font-bold text-slate-800">{template.title || 'Untitled'}</h3>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onCopy(template.message); }}
            className="shrink-0 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors"
          >
            COPY
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {template.message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-500 rounded-2xl p-5 shadow-lg shadow-indigo-100 flex flex-col">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1 pr-2 cursor-pointer" onClick={() => setExpanded(false)}>
          <span className={classNames(
            "text-[10px] font-bold uppercase tracking-widest block",
            template.source === 'local' ? "text-indigo-500" : "text-emerald-500"
          )}>
            {template.source === 'local' ? 'Custom' : 'Vault'}
          </span>
          <h3 className="text-base font-bold text-slate-800">{template.title || 'Untitled'}</h3>
        </div>
        <div className="flex space-x-1 shrink-0 bg-white">
          <button onClick={() => onSend(template, 'whatsapp')} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="WhatsApp">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button onClick={() => onSend(template, 'email')} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Email">
            <Mail className="w-5 h-5" />
          </button>
          <button onClick={() => onSend(template, 'sms')} className="p-2 text-slate-400 hover:text-slate-800 transition-colors" title="SMS">
            <Smartphone className="w-5 h-5" />
          </button>
          {template.source === 'local' && (
            <>
              <button onClick={() => onEdit?.(template)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => onDelete?.(template.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div 
        className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer"
        onClick={() => setExpanded(false)}
      >
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
          {template.subject && (
            <>
              <span className="font-bold">Subject:</span> {template.subject}
              <br /><br />
            </>
          )}
          {template.message}
        </p>
      </div>
      
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] sm:max-w-[200px]">
          {template.subject ? `Subject: ${template.subject}` : 'No Subject'}
        </span>
        <button 
          onClick={() => onCopy(template.message)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors"
        >
          Copied!
        </button>
      </div>
    </div>
  );
};

// -- AddEditModal --
interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  editingTemplate?: Template | null;
}

function AddEditModal({ isOpen, onClose, onSave, editingTemplate }: AddEditModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setTitle(editingTemplate.title);
        setSubject(editingTemplate.subject);
        setMessage(editingTemplate.message);
      } else {
        setTitle('');
        setSubject('');
        setMessage('');
      }
    }
  }, [isOpen, editingTemplate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !subject.trim() && !message.trim()) return;

    const savedTemplate: Template = {
      id: editingTemplate ? editingTemplate.id : `local-${uuidv4()}`,
      title: title.trim(),
      subject: subject.trim(),
      message: message.trim(),
      source: 'local'
    };
    onSave(savedTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {editingTemplate ? 'Edit Template' : 'Add Template'}
          </h2>
          <button onClick={onClose} className="p-1 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow flex flex-col space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Follow Up - Hot Lead"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Checking in on your property search"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex-grow flex flex-col">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Message *</label>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message template here..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all flex-grow min-h-[150px] resize-y"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-colors"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -- SendModal --
interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  method: 'whatsapp' | 'email' | 'sms';
}

function SendModal({ isOpen, onClose, template, method }: SendModalProps) {
  const [recipient, setRecipient] = useState('');

  if (!isOpen || !template) return null;

  const handleSend = () => {
    let url = '';
    const body = encodeURIComponent(template.message);
    const subject = encodeURIComponent(template.subject || template.title);
    
    // simple cleanup for phone numbers
    const cleanNumber = recipient.replace(/[^\d+]/g, '');

    switch (method) {
      case 'whatsapp':
        // If number exists, send to number, otherwise open WhatsApp general share
        url = cleanNumber 
          ? `https://wa.me/${cleanNumber}?text=${body}` 
          : `https://api.whatsapp.com/send?text=${body}`;
        break;
      case 'email':
        url = `mailto:${recipient}?subject=${subject}&body=${body}`;
        break;
      case 'sms':
        // Basic SMS link (differs slightly by OS, but basic standard)
        url = `sms:${cleanNumber}?body=${body}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      onClose();
    }
  };

  const getLabel = () => {
    switch(method) {
      case 'whatsapp': return 'PH';
      case 'email': return 'EM';
      case 'sms': return 'PH';
    }
  };

  const getPlaceholder = () => {
    switch(method) {
      case 'whatsapp': return '+1 (555) 000-0000';
      case 'email': return 'client@example.com';
      case 'sms': return '+1 (555) 000-0000';
    }
  };

  const getButtonClass = () => {
    switch(method) {
      case 'whatsapp': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'email': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'sms': return 'bg-slate-800 hover:bg-slate-900 text-white';
    }
  };

  const getButtonIcon = () => {
    switch(method) {
      case 'whatsapp': return <MessageSquare className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'sms': return <Smartphone className="w-5 h-5" />;
    }
  };
  
  const getButtonText = () => {
    switch(method) {
      case 'whatsapp': return 'Send via WhatsApp';
      case 'email': return 'Send via Email';
      case 'sms': return 'Send SMS';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Direct Action</h2>
            <p className="text-xs text-slate-400 mt-1">Send selected template</p>
          </div>
          <button onClick={onClose} className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter">
              Contact Information
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {getLabel()}
              </span>
              <input
                type={method === 'email' ? 'email' : 'tel'}
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-center mt-2">
              Leave blank to use default app
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSend}
              className={`flex items-center justify-center space-x-3 w-full py-4 rounded-2xl font-bold transition-all shadow-sm ${getButtonClass()}`}
            >
              {getButtonIcon()}
              <span>{getButtonText()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFields, setSearchFields] = useState<Record<SearchTab, boolean>>({
    Title: true,
    Subject: true,
    Message: false
  });
  
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
      const matchTitle = searchFields.Title && (template.title || '').toLowerCase().includes(query);
      const matchSubject = searchFields.Subject && (template.subject || '').toLowerCase().includes(query);
      const matchMessage = searchFields.Message && (template.message || '').toLowerCase().includes(query);

      return matchTitle || matchSubject || matchMessage;
    });
  }, [templates, searchQuery, searchFields]);

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
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto gap-1">
              {(['Title', 'Subject', 'Message'] as SearchTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSearchFields(prev => ({ ...prev, [tab]: !prev[tab] }))}
                  className={classNames(
                    "flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg text-sm transition-all whitespace-nowrap",
                    searchFields[tab]
                      ? "bg-white text-indigo-600 shadow-sm font-bold ring-1 ring-slate-200/50" 
                      : "text-slate-500 hover:text-slate-700 font-semibold hover:bg-slate-200/50"
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
                placeholder="Search templates..."
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
