import type { Dispatch, SetStateAction } from "react";

type AudioControlProps = {
  isLooping: boolean;
  isCustomLoopActive: boolean;
  setIsCustomLoopActive: Dispatch<SetStateAction<boolean>>;
  stopMidi: () => void;
  startLoop: () => void;
  randomizeSettings: () => void;
  customLoopNotes: Array<string>;
  midiData: Array<string> | null;
};

export default function AudioControl({
  isLooping,
  isCustomLoopActive,
  setIsCustomLoopActive,
  stopMidi,
  startLoop,
  customLoopNotes,
  midiData,
  randomizeSettings,
}: AudioControlProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-5 border-b border-gray-700 pb-4">
      <button
        onClick={isLooping ? stopMidi : startLoop}
        disabled={
          !(
            (isCustomLoopActive && customLoopNotes.length > 0) ||
            (midiData && midiData.length > 0)
          )
        }
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors shadow-md disabled:opacity-50"
      >
        {isLooping ? "Stop Loop" : "Start Loop"}
      </button>
      <button
        onClick={() => setIsCustomLoopActive((previous) => !previous)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors shadow-md"
      >
        {isCustomLoopActive ? "Hide Custom Loop" : "Custom Loop"}
      </button>
      <button
        onClick={randomizeSettings}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors shadow-md"
      >
        Randomize
      </button>
    </div>
  );
}
