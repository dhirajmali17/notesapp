import React, { useEffect, useState } from 'react';
import './index.css';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from "./amplify_outputs.json";
import { generateClient } from 'aws-amplify/api';
import { listNotes } from './graphql/queries';
import { createNote, deleteNote } from './graphql/mutations';
import { uploadData, getUrl } from 'aws-amplify/storage';

Amplify.configure(outputs);
const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const results = await client.graphql({ query: listNotes });
    const items = results.data.listNotes.items;

    const notesWithImageUrls = await Promise.all(
      items.map(async (note) => {
        if (note.image) {
          const url = await getUrl({ key: note.image });
          return { ...note, imageUrl: url.url };
        }
        return note;
      })
    );

    setNotes(notesWithImageUrls);
  }

  async function handleCreateNote() {
    const { name, description, image } = formData;
    if (!name || !description) return alert('Name and description required');

    let imageName = null;

    if (image) {
      imageName = `${Date.now()}-${image.name}`;
      await uploadData({
        key: imageName,
        data: image,
      }).result;
    }

    await client.graphql({
      query: createNote,
      variables: {
        input: {
          name,
          description,
          image: imageName,
        },
      },
    });

    setFormData({ name: '', description: '', image: null });
    fetchNotes();
  }

  async function handleDeleteNote(id) {
    await client.graphql({
      query: deleteNote,
      variables: { input: { id } },
    });
    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main className="app-container">
          <h1>Welcome, {user?.username} 👋</h1>
          <p>You are now signed in to your Notes App.</p>
          <button className="button" onClick={signOut}>Sign out</button>

          <div className="form-container">
            <input
              type="text"
              placeholder="Note name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Note description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            />
            <button className="button" onClick={handleCreateNote}>Create Note</button>
          </div>

          <div className="notes-list">
            {notes.map((note) => (
              <div className="note" key={note.id}>
                <h3>{note.name}</h3>
                <p>{note.description}</p>
                {note.imageUrl && <img src={note.imageUrl} alt={note.name} />}
                <button className="delete-btn" onClick={() => handleDeleteNote(note.id)}>Delete</button>
              </div>
            ))}
          </div>
        </main>
      )}
    </Authenticator>
  );
}
