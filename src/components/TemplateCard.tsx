import React, { useState } from 'react';
import { Template } from '../types';
import { classNames } from '../utils';
import { Copy, Edit2, Trash2, MessageSquare, Mail, Smartphone } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onCopy: (text: string) => void;
  onEdit?: (template: Template) => void;
  onDelete?: (id: string) => void;
  onSend: (template: Template, method: 'whatsapp' | 'email' | 'sms') => void;
}

export function TemplateCard({ template, onCopy, onEdit, onDelete, onSend }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div 
        onClick={() => setExpanded(true)}
        className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all cursor-pointer relative"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1 pr-4">
            <span className={classNames(
              "text-[10px] font-bold uppercase tracking-widest block",
              template.source === 'local' ? "text-indigo-500" : "text-emerald-500"
            )}>
              {template.source === 'local' ? 'Custom' : 'Vault'}
            </span>
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
}
