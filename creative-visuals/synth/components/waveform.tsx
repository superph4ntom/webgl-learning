import type { RefObject } from "react";

type WaveformProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
};

export default function Waveform({ canvasRef }: WaveformProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-1">
        Waveform
      </label>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="border border-gray-600 rounded-md bg-gray-950 w-full aspect-[6/1]"
      />
    </div>
  );
}
