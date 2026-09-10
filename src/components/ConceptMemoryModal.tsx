import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  X,
  Play,
  Trash2,
  Edit3,
  Bookmark,
  Plus,
  Sparkles,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { SavedConcept } from '../types';
import { conceptMemoryService } from '../services/conceptMemoryService';

interface ConceptMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentName?: string;
  onJumpToConcept?: (pageIndex: number, sentenceIndex: number) => void;
}

export const ConceptMemoryModal: React.FC<ConceptMemoryModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  onJumpToConcept,
}) => {
  const [concepts, setConcepts] = useState<SavedConcept[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  // New concept form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newContext, setNewContext] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConcepts();
    }
  }, [isOpen, documentId]);

  const loadConcepts = () => {
    if (documentId) {
      setConcepts(conceptMemoryService.getConceptsForDocument(documentId));
    } else {
      setConcepts(conceptMemoryService.getAllConcepts());
    }
  };

  if (!isOpen) return null;

  const filteredConcepts = searchQuery
    ? concepts.filter(
        (c) =>
          c.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : concepts;

  const handleSaveNote = (id: string) => {
    conceptMemoryService.updateConceptNote(id, editingNote);
    setEditingId(null);
    loadConcepts();
  };

  const handleDelete = (id: string) => {
    conceptMemoryService.deleteConcept(id);
    loadConcepts();
  };

  const handleCreateConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDefinition.trim()) return;

    conceptMemoryService.addConcept({
      documentId: documentId || 'general',
      documentName: documentName || 'Philosophical Library',
      term: newTerm.trim(),
      definition: newDefinition.trim(),
      philosophicalContext: newContext.trim() || undefined,
      pageIndex: 0,
      sentenceIndex: 0,
    });

    setNewTerm('');
    setNewDefinition('');
    setNewContext('');
    setShowAddForm(false);
    loadConcepts();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-serif">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Concept Memory Bank</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono font-bold">
                  {concepts.length} Saved
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Key philosophical terms, definitions, and text locations saved across reading sessions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 flex items-center gap-3 font-sans">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search philosophical terms, definitions, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Concept</span>
          </button>
        </div>

        {/* New Concept Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateConcept}
            className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 space-y-3 font-sans animate-fadeIn"
          >
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Save New Philosophical Concept</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Concept Term (e.g. Phenomenology)"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                required
                className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Philosophical Context (e.g. Heidegger, Being & Time)"
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <textarea
              placeholder="Core Definition or Meaning..."
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
              required
              rows={2}
              className="w-full p-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-200/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Concepts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans">
          {filteredConcepts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto stroke-1" />
              <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? 'No matching concepts found.'
                  : 'No saved concepts yet. Save key philosophical terms directly while listening or reading.'}
              </p>
            </div>
          ) : (
            filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-500/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold font-serif text-slate-900 dark:text-amber-200">
                        {concept.term}
                      </span>
                      {concept.philosophicalContext && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                          {concept.philosophicalContext}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                      <span>{concept.documentName}</span>
                      <span>•</span>
                      <span>Page {concept.pageIndex + 1}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {onJumpToConcept && (
                      <button
                        onClick={() => {
                          onJumpToConcept(concept.pageIndex, concept.sentenceIndex);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Jump to position in text and play"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Jump</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(concept.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Delete Concept"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {concept.definition}
                </p>

                {/* Personal Notes */}
                {editingId === concept.id ? (
                  <div className="space-y-2 font-sans pt-1">
                    <textarea
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      placeholder="Add personal philosophical reflections or notes..."
                      className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-400 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNote(concept.id)}
                        className="px-3 py-1 text-xs font-bold bg-amber-600 text-white rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      {concept.notes ? `Note: "${concept.notes}"` : 'No personal note added.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingId(concept.id);
                        setEditingNote(concept.notes || '');
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{concept.notes ? 'Edit Note' : '+ Add Note'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
