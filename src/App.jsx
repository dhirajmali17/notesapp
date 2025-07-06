import { useState, useEffect } from 'react';
import {
  Authenticator,
  View,
  Image,
  Text,
  TextField,
  Flex,
  Button,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { generateClient } from 'aws-amplify/data';
import { getUrl, uploadData } from 'aws-amplify/storage';
import outputs from '../amplify_outputs.json';

import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { listNotes } from './graphql/queries';

import { Amplify } from 'aws-amplify';
Amplify.configure(outputs);

const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [noteData, setNoteData] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await client.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;

    // Load image URLs
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const imageUrl = await getUrl({ key: note.image });
          note.imageUrl = imageUrl.url;
        }
        return note;
      })
    );

    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    if (!noteData.name || !noteData.description) return;

    const newNote = { ...noteData };

    if (file) {
      newNote.image = file.name;
      await uploadData({
        key: file.name,
        data: file,
      }).result;
    }

    await client.graphql({
      query: createNoteMutation,
      variables: { input: newNote },
    });

    setNoteData({ name: '', description: '' });
    setFile(null);
    fetchNotes();
  }

  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);

    await client.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <View className="App">
          <Text as="h1">My Notes App</Text>
          <View as="form" margin="3rem 0" onSubmit={createNote}>
            <Flex direction="column" justifyContent="center">
              <TextField
                name="name"
                placeholder="Note name"
                label="Note name"
                value={noteData.name}
                onChange={(e) =>
                  setNoteData({ ...noteData, name: e.target.value })
                }
              />
              <TextField
                name="description"
                placeholder="Note description"
                label="Note description"
                value={noteData.description}
                onChange={(e) =>
                  setNoteData({ ...noteData, description: e.target.value })
                }
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <Button type="submit" variation="primary">
                Create Note
              </Button>
            </Flex>
          </View>
          <View margin="3rem 0">
            {notes.map((note) => (
              <Flex
                key={note.id || note.name}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text as="strong" fontWeight="bold">
                  {note.name}
                </Text>
                <Text as="span">{note.description}</Text>
                {note.imageUrl && (
                  <Image
                    src={note.imageUrl}
                    alt={`Visual for ${note.name}`}
                    style={{ width: 200 }}
                  />
                )}
                <Button variation="link" onClick={() => deleteNote(note)}>
                  Delete Note
                </Button>
              </Flex>
            ))}
          </View>
          <Button onClick={signOut}>Sign Out</Button>
        </View>
      )}
    </Authenticator>
  );
}

export default App;
