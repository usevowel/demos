/**
 * Notes store - manages user notes with sessionStorage persistence
 *
 * Notes are stored in sessionStorage and persist for the browser tab session.
 * Data is lost when the tab is closed.
 */

import { proxy } from 'valtio'

const SESSION_STORAGE_KEY = 'vowel-net-notes'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface NotesStore {
  notes: Note[]
}

/**
 * Default seed notes shown when sessionStorage is empty.
 * Treated like todos from a previous session—gives the demo a realistic starting state.
 */
function getDefaultNotes(): Note[] {
  const now = Date.now()
  return [
    {
      id: 'note-seed-1',
      title: 'Investigate router-core-03 high CPU',
      content: 'Spike reported yesterday. Check if firmware update needed.',
      createdAt: new Date(now - 4 * 60 * 60 * 1000),
      updatedAt: new Date(now - 4 * 60 * 60 * 1000),
    },
    {
      id: 'note-seed-2',
      title: 'Schedule firmware update for Building 2 switches',
      content: '5 switches need v2.1.4. Plan maintenance window.',
      createdAt: new Date(now - 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 4 * 60 * 60 * 1000),
    },
    {
      id: 'note-seed-3',
      title: 'Review unacknowledged critical events',
      content: '3 critical events pending. Acknowledge or escalate.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000),
    },
  ]
}

/** Load notes from sessionStorage, parsing dates. Returns default seed notes when storage is empty. */
function loadFromStorage(): Note[] {
  if (typeof window === 'undefined') return getDefaultNotes()
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return getDefaultNotes()
    const parsed = JSON.parse(raw) as Array<Omit<Note, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }>
    return parsed.map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }))
  } catch {
    return getDefaultNotes()
  }
}

/** Persist notes to sessionStorage */
function persist(notes: Note[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const initialState: NotesStore = {
  notes: loadFromStorage(),
}

export const notesStore = proxy<NotesStore>(initialState)

/** Create a new note */
export function createNote(title: string, content: string = ''): Note {
  const now = new Date()
  const note: Note = {
    id: generateId(),
    title: title.trim() || 'Untitled',
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  }
  notesStore.notes = [note, ...notesStore.notes]
  persist(notesStore.notes)
  return note
}

/** Update an existing note */
export function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): Note | null {
  const idx = notesStore.notes.findIndex((n) => n.id === id)
  if (idx === -1) return null
  const note = notesStore.notes[idx]
  const updated: Note = {
    ...note,
    ...updates,
    title: (updates.title ?? note.title).trim() || 'Untitled',
    content: (updates.content ?? note.content).trim(),
    updatedAt: new Date(),
  }
  notesStore.notes = [...notesStore.notes]
  notesStore.notes[idx] = updated
  persist(notesStore.notes)
  return updated
}

/** Delete a note */
export function deleteNote(id: string): boolean {
  const idx = notesStore.notes.findIndex((n) => n.id === id)
  if (idx === -1) return false
  notesStore.notes = notesStore.notes.filter((n) => n.id !== id)
  persist(notesStore.notes)
  return true
}

/** Get a note by ID */
export function getNoteById(id: string): Note | undefined {
  return notesStore.notes.find((n) => n.id === id)
}

/** Get all notes (newest first) */
export function getAllNotes(): Note[] {
  return notesStore.notes
}
