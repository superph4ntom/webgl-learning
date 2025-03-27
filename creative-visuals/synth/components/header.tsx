import { Music } from "lucide-react";

export default function Header() {
  return (
    <header className="mb-6 border-b border-gray-700 pb-4">
      <div className="flex items-center space-x-4">
        <Music className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">
            AI MIDI Generator & Synth
          </h1>
          <p className="text-sm text-gray-400">Describe, generate, tweak.</p>
        </div>
      </div>
    </header>
  );
}
