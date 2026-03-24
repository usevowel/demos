/**
 * Notes page - create, view, and manage session notes
 */

import { createFileRoute } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { FileText, Plus, Trash2, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  notesStore,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from '@/store/notesStore'

function NotesPage() {
  const snap = useSnapshot(notesStore)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const handleCreate = () => {
    if (newTitle.trim() || newContent.trim()) {
      createNote(newTitle, newContent)
      setNewTitle('')
      setNewContent('')
      setShowNewForm(false)
    }
  }

  const handleUpdate = (id: string, title: string, content: string) => {
    updateNote(id, { title, content })
    setEditingId(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <FileText className="h-8 w-8 text-cisco-blue" />
            Notes
          </h1>
          {/* <p className="text-text-secondary mt-1">
            Session notes—stored in this tab until you close it
          </p> */}
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-cisco-blue text-white rounded-lg hover:bg-cisco-blue/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* New note form */}
      {showNewForm && (
        <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cisco-blue"
          />
          <textarea
            placeholder="Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-cisco-blue resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-cisco-blue text-white rounded-lg hover:bg-cisco-blue/90"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowNewForm(false)
                setNewTitle('')
                setNewContent('')
              }}
              className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border hover:bg-bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-4">
        {snap.notes.length === 0 && !showNewForm ? (
          <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center text-text-secondary">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes yet. Create one with the button above or say "add a note" to the voice assistant.</p>
          </div>
        ) : (
          snap.notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onStartEdit={() => setEditingId(note.id)}
              onSave={(title, content) => handleUpdate(note.id, title, content)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface NoteCardProps {
  note: Note
  isEditing: boolean
  onStartEdit: () => void
  onSave: (title: string, content: string) => void
  onCancelEdit: () => void
  onDelete: () => void
}

function NoteCard({ note, isEditing, onStartEdit, onSave, onCancelEdit, onDelete }: NoteCardProps) {
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content)

  /** Sync edit fields when entering edit mode or when note changes */
  useEffect(() => {
    if (isEditing) {
      setEditTitle(note.title)
      setEditContent(note.content)
    }
  }, [isEditing, note.title, note.content])

  const handleSave = () => {
    onSave(editTitle, editContent)
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
      {isEditing ? (
        <div className="p-4 space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cisco-blue"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cisco-blue resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cisco-blue text-white rounded-lg hover:bg-cisco-blue/90"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">{note.title}</h3>
              <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap break-words">
                {note.content || <span className="italic">No content</span>}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                {note.updatedAt.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={onStartEdit}
                className="p-2 text-text-secondary hover:text-cisco-blue hover:bg-bg-tertiary rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-text-secondary hover:text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const Route = createFileRoute('/notes' as any)({
  component: NotesPage,
})
