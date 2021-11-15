import React, { useState } from "react";
import { AmplifyAuthenticator, AmplifyGreetings } from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";

const GreetingsApp = () => {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    });
  }, []);

  return authState === AuthState.SignedIn && user ? (
    <AmplifyGreetings username={user.attributes.email}></AmplifyGreetings>
  ) : (
    <AmplifyAuthenticator />
  );
};

function App() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [curId, setCurId] = useState(null);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  React.useEffect(() => {
    getNotes();
  }, []);

  const handleChangeNote = (event) => {
    setNote(event.target.value);
  };

  const hasExistingNote = () => {
    if (curId !== null) {
      const isNote = notes.findIndex((note) => note.id === curId) > -1;
      return isNote;
    }
    return false;
  };

  const handleUpdateNote = async () => {
    const input = { id: curId, note };
    const result = await API.graphql(graphqlOperation(updateNote, { input }));
    const updatedNote = result.data.updateNote;
    const index = notes.findIndex((note) => note.id === updatedNote.id);
    const updatedNotes = [
      ...notes.slice(0, index),
      updatedNote,
      ...notes.slice(index + 1),
    ];
    setNotes(updatedNotes);
    setNote("");
    setCurId(null);
  };

  const handleAddNote = async (event) => {
    event.preventDefault(); // prevent to reload the page

    // first, check if we have an existing note. If yes, then update it
    if (hasExistingNote()) {
      await handleUpdateNote();
    } else {
      const input = { note };
      const result = await API.graphql(graphqlOperation(createNote, { input }));
      setNotes([result.data.createNote, ...notes]);
      setNote(""); //reset the input
    }
  };

  const handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deleteNoteId = result.data.deleteNote.id;
    const updatedNotes = notes.filter((note) => note.id !== deleteNoteId);
    setNotes(updatedNotes);
  };

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setCurId(id);
  };

  const NotesList = () => {
    return notes.map((item) => (
      <div key={item.id} className="flex items-center">
        <li onClick={() => handleSetNote(item)} className="list pa1 f3">
          {item.note}
        </li>
        <button
          onClick={() => handleDeleteNote(item.id)}
          className="bg-transparent bn f4"
        >
          <span>&times;</span>
        </button>
      </div>
    ));
  };

  return (
    <>
      <GreetingsApp />
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Amplify Notetaker</h1>
        {/* Note Form */}
        <form onSubmit={handleAddNote} className="mb3">
          <input
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            onChange={handleChangeNote}
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {curId ? "Update Note" : "Add Note"}
          </button>
        </form>

        {/* Note List */}
        <div>
          <NotesList />
        </div>
      </div>
    </>
  );
}

export default App;
