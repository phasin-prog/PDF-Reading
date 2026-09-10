import { SavedConcept } from '../types';

const STORAGE_KEY = 'pdf_tts_saved_concepts_v1';

class ConceptMemoryService {
  private concepts: SavedConcept[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.concepts = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load saved concepts from storage:', e);
      this.concepts = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.concepts));
    } catch (e) {
      console.warn('Failed to save concepts to storage:', e);
    }
  }

  public getAllConcepts(): SavedConcept[] {
    return [...this.concepts].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getConceptsForDocument(documentId: string): SavedConcept[] {
    return this.concepts.filter((c) => c.documentId === documentId);
  }

  public addConcept(concept: Omit<SavedConcept, 'id' | 'createdAt'>): SavedConcept {
    const newConcept: SavedConcept = {
      ...concept,
      id: `concept_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
    };

    // Replace duplicate term for same document if exists
    this.concepts = this.concepts.filter(
      (c) => !(c.documentId === concept.documentId && c.term.toLowerCase() === concept.term.toLowerCase())
    );

    this.concepts.unshift(newConcept);
    this.saveToStorage();
    return newConcept;
  }

  public updateConceptNote(id: string, note: string) {
    const item = this.concepts.find((c) => c.id === id);
    if (item) {
      item.notes = note;
      this.saveToStorage();
    }
  }

  public deleteConcept(id: string) {
    this.concepts = this.concepts.filter((c) => c.id !== id);
    this.saveToStorage();
  }

  public searchConcepts(query: string): SavedConcept[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllConcepts();

    return this.concepts.filter(
      (c) =>
        c.term.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        (c.philosophicalContext && c.philosophicalContext.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }
}

export const conceptMemoryService = new ConceptMemoryService();
