import type { Dispatch, FormEvent, SetStateAction } from "react";

type GenAIFormProps = {
  handleSubmit: (event: FormEvent<Element>) => Promise<void>;
  setDescription: Dispatch<SetStateAction<string>>;
  description: string;
  isLoading: boolean;
};

export default function GenAIForm({
  handleSubmit,
  setDescription,
  description,
  isLoading,
}: GenAIFormProps) {
  return (
    <section className="bg-gray-800 rounded-lg p-5 mb-6 border border-gray-700">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <textarea
          placeholder="Describe your song..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="p-3 rounded-md bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-600 w-full resize-none transition"
          rows={3}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors shadow-md w-full disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate MIDI"}
        </button>
      </form>
    </section>
  );
}
