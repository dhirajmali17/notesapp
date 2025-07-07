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
        <main>
          <h1>Notes App</h1>
          <input
            placeholder="Note name"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            value={formData.name}
          />
          <textarea
            placeholder="Note description"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            value={formData.description}
          />
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <button onClick={createNote}>Create Note</button>
          <button onClick={signOut}>Sign Out</button>
          <div>
            {notes.map((note) => (
              <div key={note.id} className="note">
                <h2>{note.name}</h2>
                <p>{note.description}</p>
                {note.imageUrl && <img src={note.imageUrl} alt={note.name} width="200" />}
                <button onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            ))}
          </div>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
