import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  Heading,
  Text,
  View,
  Button,
  TextField,
  Image,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "./amplify_outputs.json";
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
    const notesList = data.listNotes.items;
    const notesWithUrls = await Promise.all(
      notesList.map(async (note) => {
        if (note.image) {
          const url = await getUrl({ key: note.image });
          return { ...note, imageUrl: url.url.toString() };
        }
        return note;
      })
    );
    setNotes(notesWithUrls);
  }

  async function createNote() {
    const { name, description, image } = formData;
    if (!name || !description) return;

    let imageKey;
    if (image) {
      const { key } = await uploadData({ key: image.name, data: image });
      imageKey = key;
    }

    await client.graphql({
      query: createNoteMutation,
      variables: { input: { name, description, image: imageKey } },
    });

    setFormData({ name: "", description: "", image: null });
    fetchNotes();
  }

  async function deleteNote(id) {
    await client.graphql({ query: deleteNoteMutation, variables: { input: { id } } });
    fetchNotes();
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <View padding="2rem" style={{ backgroundColor: "#fff", minHeight: "100vh", color: "#000" }}>
          <Heading level={1}>Notes App</Heading>

          <TextField
            placeholder="Note name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            placeholder="Note description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <Button onClick={createNote} marginTop="1rem">Create Note</Button>

          <View marginTop="2rem">
            {notes.map((note) => (
              <View key={note.id} style={{ borderBottom: "1px solid #ccc", padding: "1rem 0" }}>
                <Heading level={3}>{note.name}</Heading>
                <Text>{note.description}</Text>
                {note.imageUrl && <Image src={note.imageUrl} alt={note.name} width="200px" />}
                <Button onClick={() => deleteNote(note.id)} variation="destructive">Delete</Button>
              </View>
            ))}
          </View>

          <Button onClick={signOut} variation="primary" marginTop="2rem">Sign Out</Button>
        </View>
      )}
    </Authenticator>
  );
}

export default App;