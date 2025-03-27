import { useState } from "react";

export default function NoteButton({
  note,
  onClick,
  playPreview,
}: {
  note: string;
  onClick: (note: string) => void;
  playPreview: (note: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => {
        if (!hovered) {
          playPreview(note + "4");
          setHovered(true);
        }
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(note + "4")}
      className="bg-indigo-700 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
    >
      {note}4
    </button>
  );
}
