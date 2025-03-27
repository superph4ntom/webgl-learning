import NoteButton from "./note-button";

type CustomLoopEditorProps = {
  addNote: (note: string) => void;
  playPreview: (note: string) => any;
  randomizeCustomLoop: () => void;
  clearCustomLoop: () => void;
  removeNote: (index: number) => void;
  customLoopNotes: Array<string>;
  noteOptions: Array<string>;
};

export default function CustomLoopEditor({
  addNote,
  playPreview,
  randomizeCustomLoop,
  clearCustomLoop,
  removeNote,
  customLoopNotes,
  noteOptions,
}: CustomLoopEditorProps) {
  return (
    <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-white">
        Custom Loop Editor
      </h3>
      <div className="grid grid-cols-6 gap-3 mb-4">
        {noteOptions.map((note) => (
          <NoteButton
            key={note}
            note={note}
            onClick={addNote}
            playPreview={playPreview}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={randomizeCustomLoop}
          className="bg-green-600 hover:bg-green-500 text-white font-medium py-1 px-3 rounded-md transition-colors"
        >
          Randomize Loop
        </button>
        <button
          onClick={clearCustomLoop}
          className="bg-red-600 hover:bg-red-500 text-white font-medium py-1 px-3 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>

      {customLoopNotes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customLoopNotes.map((note, index) => (
            <div
              key={index}
              className="flex items-center bg-indigo-800 text-white px-3 py-1 rounded-full text-sm"
            >
              {note}
              <button
                onClick={() => removeNote(index)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No notes added yet.</p>
      )}
    </div>
  );
}
