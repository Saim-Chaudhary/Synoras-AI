"use client";

// The Notes tab: short summaries and decisions that the user writes for the project (FR-11).
// A button that writes a summary with the AI comes later.

import { useCallback, useState } from "react";

import { buttonClass } from "@/components/button";
import ConfirmBox from "@/components/confirm-box";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import NoteForm from "@/components/projects/note-form";
import { useProject } from "@/components/projects/project-context";
import { ApiError } from "@/lib/api";
import { useLoad } from "@/lib/use-load";
import { formatDate } from "@/lib/format";
import { NOTE_KIND_LABELS, createNote, deleteNote, listNotes, updateNote, type Note } from "@/lib/projects";

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

export default function NotesPage() {
  const { project } = useProject();
  const projectId = project.project_id;

  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setNotes(await listNotes(projectId));
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setLoadError(errorText(error));
    }
  }, [projectId]);

  // The page starts in "loading" and is created again for every project (see project-shell.tsx).
  useLoad(load);

  async function confirmDelete(note: Note) {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteNote(projectId, note.note_id);
      setNotes((list) => list.filter((n) => n.note_id !== note.note_id));
      setDeletingId(null);
    } catch (error) {
      setDeleteError(errorText(error));
    }
    setDeleteBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Notes</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
            className={buttonClass("primary")}
          >
            <PlusIcon className="size-4" />
            New note
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-muted">Write down decisions and summaries, so they are easy to find later.</p>

      {adding && (
        <div className="mt-4 max-w-2xl">
          <NoteForm
            submitLabel="Save note"
            busyLabel="Saving..."
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              try {
                const created = await createNote(projectId, values);
                setNotes((list) => [created, ...list]);
                setAdding(false);
                return null;
              } catch (error) {
                return errorText(error);
              }
            }}
          />
        </div>
      )}

      <div className="mt-4">
        {status === "loading" && (
          <p role="status" className="text-ink-muted">
            Loading notes...
          </p>
        )}

        {status === "error" && (
          <div role="alert" className="max-w-md rounded-card border border-danger-line bg-danger-soft p-4">
            <p className="text-danger">{loadError}</p>
            <button type="button" onClick={() => void load()} className={buttonClass("secondary", "mt-3")}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && notes.length === 0 && !adding && (
          <div className="rounded-card border border-line bg-raised px-6 py-10 text-center">
            <h3 className="font-semibold text-ink">No notes yet</h3>
            <p className="mx-auto mt-1.5 max-w-md text-ink-muted">
              Notes are short summaries and decisions about this project, for example &quot;We use one database for
              everything&quot;.
            </p>
          </div>
        )}

        {status === "ready" && notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.note_id} className="max-w-3xl">
                {editingId === note.note_id ? (
                  <NoteForm
                    initialKind={note.kind}
                    initialTitle={note.title}
                    initialContent={note.content}
                    submitLabel="Save changes"
                    busyLabel="Saving..."
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (values) => {
                      try {
                        const saved = await updateNote(projectId, note.note_id, values);
                        setNotes((list) => list.map((n) => (n.note_id === saved.note_id ? saved : n)));
                        setEditingId(null);
                        return null;
                      } catch (error) {
                        return errorText(error);
                      }
                    }}
                  />
                ) : deletingId === note.note_id ? (
                  <ConfirmBox
                    title={`Delete the note "${note.title}"?`}
                    busy={deleteBusy}
                    error={deleteError}
                    onConfirm={() => void confirmDelete(note)}
                    onCancel={() => setDeletingId(null)}
                  />
                ) : (
                  <article className="rounded-card border border-line bg-raised p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                          <span className="rounded-full border border-line px-2 py-0.5 font-medium text-ink">
                            {NOTE_KIND_LABELS[note.kind]}
                          </span>
                          {formatDate(note.created_at)}
                        </p>
                        <h3 className="mt-2 break-words font-semibold text-ink">{note.title}</h3>
                      </div>
                      <div className="flex shrink-0">
                        <button
                          type="button"
                          aria-label={`Edit note "${note.title}"`}
                          title="Edit note"
                          onClick={() => {
                            setAdding(false);
                            setEditingId(note.note_id);
                          }}
                          className="inline-flex size-10 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete note "${note.title}"`}
                          title="Delete note"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingId(note.note_id);
                          }}
                          className="inline-flex size-10 items-center justify-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                    {note.content && <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-ink">{note.content}</p>}
                  </article>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
