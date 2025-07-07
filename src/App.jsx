import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import outputs from "../amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData } from "aws-amplify/storage";
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";

Amplify.configure(outputs);
const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", image: null });

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data } = await client.graphql({ query: listNotes });
    const notesList = await Promise.all(
      data.listNotes.items.map(async (note) => {
        if (note.image) {
          const { url } = await getUrl({ key: note.image });
          note.imageUrl = url;
        }
        return note;
      })
    );
    setNotes(notesList);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    let imageKey;

    if (formData.image) {
      const { key } = await uploadData({
        data: formData.image,
        path: `media/${formData.image.name}`,
      }).result;
      imageKey = key;
    }

    await client.graphql({
      query: createNoteMutation,
      variables: {
        input: {
          name: formData.name,
          description: formData.description,
          image: imageKey,
        },
      },
    });

    setFormData({ name: "", description: "", image: null });
    fetchNotes();
  }

  async function deleteNote(id) {
    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <main
          style={{
            maxWidth: "800px",
            margin: "2rem auto",
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            fontFamily: "Segoe UI, sans-serif",
          }}
        >
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ margin: 0, color: "#1f2937" }}>📝 Notes App</h1>
            <button
              onClick={signOut}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </header>

          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ color: "#2563eb" }}>Create a Note</h2>
            <input
              placeholder="Note name"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              value={formData.name}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.5rem",
                marginBottom: "1rem",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
            <textarea
              placeholder="Note description"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              value={formData.description}
              style={{
                width: "100%",
                padding: "0.5rem",
                height: "100px",
                marginBottom: "1rem",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              style={{ marginBottom: "1rem" }}
            />
            <br />
            <button
              onClick={createNote}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                padding: "0.6rem 1.2rem",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "2rem",
              }}
            >
              ➕ Create Note
            </button>
          </section>

          <section>
            <h2 style={{ color: "#2563eb" }}>Your Notes</h2>
            {notes.length === 0 && <p>No notes yet!</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.5rem", color: "#111827" }}>{note.name}</h3>
                  <p style={{ marginBottom: "0.5rem", color: "#4b5563" }}>{note.description}</p>
                  {note.imageUrl && (
                    <img
                      src={note.imageUrl}
                      alt={note.name}
                      style={{ maxWidth: "100%", borderRadius: "5px", marginBottom: "0.5rem" }}
                    />
                  )}
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.4rem 0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
