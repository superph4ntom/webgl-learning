"use client";

import { Music } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../data/config";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [description, setDescription] = useState("");

  const [midiData, setMidiData] = useState<string[] | null>(
    CONFIG.default.midi
  );
  const [waveType, setWaveType] = useState(CONFIG.default.waveType);
  const [filterFrequency, setFilterFrequency] = useState(
    CONFIG.default.filterFrequency
  );

  const [attack, setAttack] = useState(CONFIG.default.attack);
  const [decay, setDecay] = useState(CONFIG.default.decay);
  const [sustain, setSustain] = useState(CONFIG.default.sustain);
  const [release, setRelease] = useState(CONFIG.default.release);
  const [detune, setDetune] = useState(0);

  const [modulationDepth, setModulationDepth] = useState(0.5);
  const [lfoSpeed, setLfoSpeed] = useState(CONFIG.default.lfoSpeed);
  const [tempo, setTempo] = useState(CONFIG.default.tempo);

  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const vibratoRef = useRef(null);
  const analyserRef = useRef(null);
  const loopRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(null);

  const inputs = [
    { label: "Attack", value: attack, setter: setAttack },
    { label: "Decay", value: decay, setter: setDecay },
    { label: "Sustain", value: sustain, setter: setSustain },
    { label: "Release", value: release, setter: setRelease },
  ];

  useEffect(() => {
    // Create the PolySynth with envelope and oscillator settings
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: waveType, detune: detune },
      envelope: { attack, decay, sustain, release },
    });

    // Create a vibrato effect (always using default "sine")
    vibratoRef.current = new Tone.Vibrato({
      frequency: lfoSpeed,
      depth: modulationDepth,
    });

    // Create filter and analyser nodes
    filterRef.current = new Tone.Filter(filterFrequency, "lowpass");
    analyserRef.current = new Tone.Analyser("waveform", 1024);

    // Chain the nodes: synth -> vibrato -> filter -> analyser -> destination
    synthRef.current.chain(
      vibratoRef.current,
      filterRef.current,
      analyserRef.current,
      Tone.Destination
    );

    // Set the global tempo
    Tone.Transport.bpm.value = tempo;

    return () => {
      stopMidi();
      synthRef.current?.dispose();
      vibratoRef.current?.dispose();
      filterRef.current?.dispose();
      analyserRef.current?.dispose();
      loopRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        oscillator: { type: waveType },
        envelope: { attack, decay, sustain, release },
      });
    }
  }, [waveType, attack, decay, sustain, release]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        oscillator: { detune: detune }, // Update the detune property here
      });
    }
  }, [detune]);

  useEffect(() => {
    if (filterRef.current) filterRef.current.frequency.value = filterFrequency;
  }, [filterFrequency]);

  useEffect(() => {
    if (vibratoRef.current) {
      vibratoRef.current.set({
        frequency: lfoSpeed,
        depth: modulationDepth,
      });
    }
  }, [modulationDepth, lfoSpeed]);

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  const animate = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = analyserRef.current.getValue() as number[];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    const sliceWidth = canvas.width / buffer.length;
    let x = 0;
    buffer.forEach((value, index) => {
      const y = (1 - (value + 1) / 2) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    });
    ctx.strokeStyle = "#ff4081";
    ctx.lineWidth = 2;
    ctx.stroke();
    animationRef.current = requestAnimationFrame(animate);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      if (data.midi) {
        const sanitizedNotes = extractABCNotes(data.midi);
        setMidiData(sanitizedNotes);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const extractABCNotes = (midiText: string): string[] =>
    midiText
      .replace(/[\[\]|]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/,\s*/)
      .filter((note) => /^[A-G][#b]?[0-9]$/.test(note));

  function playMidi() {
    if (isPlaying) return;
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(animate);
    Tone.Transport.start();

    const secondsPerBeat = 60 / tempo;
    const now = Tone.now();
    let time = now;

    midiData!.forEach((note) => {
      synthRef.current?.triggerAttackRelease(note, secondsPerBeat, time);
      time += secondsPerBeat;
    });

    setTimeout(() => {
      if (!isLooping) {
        stopMidi();
      }
    }, (time - now) * 1000);
  }

  function startLoop() {
    if (!loopRef.current) {
      let index = 0;
      loopRef.current = new Tone.Loop((time) => {
        const note = midiData[index % midiData.length];
        synthRef.current?.triggerAttackRelease(note, "8n", time);
        index++;
      }, "8n");
    }

    loopRef.current._index = 0;
    loopRef.current.start(0);
    Tone.Transport.start();
    setIsLooping(true);
    animationRef.current = requestAnimationFrame(animate);
    setIsPlaying(true);
  }

  function stopLoop() {
    if (loopRef.current) loopRef.current.stop();
    setIsLooping(false);
  }

  function stopMidi() {
    Tone.Transport.stop();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (isLooping) stopLoop();
    setIsPlaying(false);
  }

  function randomizeSettings() {
    const waveTypes = ["sine", "square", "sawtooth", "triangle"];
    setWaveType(waveTypes[Math.floor(Math.random() * waveTypes.length)]);

    const random = () => parseFloat(Math.random().toFixed(2));

    setFilterFrequency(Math.floor(Math.random() * 1981) + 20);
    setAttack(random());
    setDecay(random());
    setSustain(random());
    setRelease(random());
    setModulationDepth(random());
    setLfoSpeed(parseFloat((Math.random() * 9.9 + 0.1).toFixed(1)));
    setTempo(Math.floor(Math.random() * 161) + 40);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg p-6">
        <header className="flex items-center space-x-4">
          <Music className="w-8 h-8 text-pink-500" />
          <div>
            <h1 className="text-3xl font-bold">Song to MIDI Generator</h1>
            <p className="text-lg text-gray-300">
              Describe your song idea and let AI create a MIDI composition for
              you
            </p>
          </div>
        </header>

        <section className="bg-gray-700 rounded-md p-4 mt-6">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <textarea
              placeholder="Describe your song (event.g., 'A gentle piano melody with a soft jazz feel')"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="p-2 rounded-md bg-gray-600 text-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate MIDI"}
            </button>
          </form>
        </section>

        <section className="bg-gray-700 rounded-md p-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">Your Generated MIDI</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={playMidi}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              disabled={isPlaying}
            >
              Play Once
            </button>
            {!isLooping ? (
              <button
                onClick={startLoop}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                disabled={isPlaying}
              >
                Start Loop
              </button>
            ) : (
              <button
                onClick={stopLoop}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                Stop Loop
              </button>
            )}
            <button
              onClick={stopMidi}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              disabled={!isPlaying}
            >
              Stop All
            </button>
            <button
              onClick={randomizeSettings}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Randomize Settings
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="border border-gray-500 mt-4"
          />

          <div className="mt-6 text-left">
            <h2 className="text-xl font-semibold">Synth Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="waveType" className="block">
                  Wave Type
                </label>
                <select
                  id="waveType"
                  value={waveType}
                  onChange={(event) => setWaveType(event.target.value)}
                  className="w-full p-2 rounded-md bg-gray-600 text-white"
                >
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                  <option value="triangle">Triangle</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="filterFrequency" className="block">
                  Filter Frequency
                </label>
                <input
                  id="filterFrequency"
                  type="range"
                  min="20"
                  max="2000"
                  value={filterFrequency}
                  onChange={(event) =>
                    setFilterFrequency(Number(event.target.value))
                  }
                  className="w-full"
                />
                <span>{filterFrequency} Hz</span>
              </div>
            </div>

            <h3 className="mt-6 text-lg font-semibold">Envelope Settings</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {inputs.map(({ label, value, setter }) => (
                <div key={label} className="space-y-2">
                  <label htmlFor={label} className="block">
                    {label}
                  </label>
                  <input
                    id={label}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(event) => setter(Number(event.target.value))}
                    className="w-full"
                  />
                  <span>{value}</span>
                </div>
              ))}
              <div className="space-y-2 mt-4">
                <label htmlFor="detune" className="block">
                  Detune (Octave Shift)
                </label>
                <input
                  id="detune"
                  type="range"
                  min="-1200"
                  max="1200"
                  step="100"
                  value={detune}
                  onChange={(event) => setDetune(Number(event.target.value))}
                  className="w-full"
                />
                <span>{(detune / 100).toFixed(1)} semitones</span>
              </div>
            </div>

            <h3 className="mt-6 text-lg font-semibold">Modulation Controls</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="modulationDepth" className="block">
                  Modulation Depth
                </label>
                <input
                  id="modulationDepth"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={modulationDepth}
                  onChange={(event) =>
                    setModulationDepth(Number(event.target.value))
                  }
                  className="w-full"
                />
                <span>{modulationDepth}</span>
              </div>
              <div className="space-y-2">
                <label htmlFor="lfoSpeed" className="block">
                  LFO Speed (Hz)
                </label>
                <input
                  id="lfoSpeed"
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={lfoSpeed}
                  onChange={(event) => setLfoSpeed(Number(event.target.value))}
                  className="w-full"
                />
                <span>{lfoSpeed} Hz</span>
              </div>
            </div>

            <h3 className="mt-6 text-lg font-semibold">Tempo</h3>
            <div className="space-y-2 mt-4">
              <label htmlFor="tempo" className="block">
                Tempo (BPM)
              </label>
              <input
                id="tempo"
                type="number"
                value={tempo}
                onChange={(event) => setTempo(Number(event.target.value))}
                className="w-full p-2 rounded-md bg-gray-600 text-white"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
