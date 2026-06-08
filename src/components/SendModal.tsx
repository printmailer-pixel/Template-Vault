import React, { useState } from 'react';
import { Template } from '../types';
import { X, MessageSquare, Mail, Smartphone } from 'lucide-react';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  method: 'whatsapp' | 'email' | 'sms';
}

export function SendModal({ isOpen, onClose, template, method }: SendModalProps) {
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
