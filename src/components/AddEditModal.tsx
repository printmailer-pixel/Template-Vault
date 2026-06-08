import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  editingTemplate?: Template | null;
}

export function AddEditModal({ isOpen, onClose, onSave, editingTemplate }: AddEditModalProps) {
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
