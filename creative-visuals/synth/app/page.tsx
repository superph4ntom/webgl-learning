"use client";

//import * as Tone from "tone";
import { Music } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

// --- Configuration ---
const CONFIG = {
  default: {
    midi: null,
    waveType: "sine",
    filterFrequency: 1500,
    attack: 0.1,
    decay: 0.2,
    sustain: 0.5,
    release: 0.8, // Default sustain should be 0-1
    lfoSpeed: 2,
    tempo: 120,
  },
};
// --- End Configuration ---

// Instrument options
const instrumentOptions = [
  { value: "Synth", label: "Synth" },
  { value: "AMSynth", label: "AM Synth" },
  { value: "FMSynth", label: "FM Synth" },
  { value: "MembraneSynth", label: "Membrane Synth" },
  { value: "PluckSynth", label: "Pluck Synth" },
];

// Helper function
const isMonophonicForPolySynth = (type: string): boolean =>
  type !== "PluckSynth";

export default function Home() {
  // --- State Variables ---
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [description, setDescription] = useState("");
  const [midiData, setMidiData] = useState<string[] | null>(
    CONFIG.default.midi
  );
  const [selectedInstrument, setSelectedInstrument] = useState<string>(
    instrumentOptions[0].value
  );
  const [waveType, setWaveType] = useState<string>(CONFIG.default.waveType);
  const [filterFrequency, setFilterFrequency] = useState<number>(
    CONFIG.default.filterFrequency
  );
  const [attack, setAttack] = useState<number>(CONFIG.default.attack);
  const [decay, setDecay] = useState<number>(CONFIG.default.decay);
  // Ensure initial sustain is within [0, 1]
  const [sustain, setSustain] = useState<number>(
    Math.min(1, Math.max(0, CONFIG.default.sustain))
  );
  const [release, setRelease] = useState<number>(CONFIG.default.release);
  const [detune, setDetune] = useState<number>(0);
  const [modulationDepth, setModulationDepth] = useState<number>(0.5);
  const [lfoSpeed, setLfoSpeed] = useState<number>(CONFIG.default.lfoSpeed);
  const [tempo, setTempo] = useState<number>(CONFIG.default.tempo);

  // --- Refs ---
  const synthRef = useRef<Tone.Instrument<any> | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // --- Envelope Inputs Config ---
  const envelopeInputs = [
    {
      label: "Attack",
      value: attack,
      setter: setAttack,
      min: 0.01,
      max: 2,
      step: 0.01,
      unit: "s",
    },
    {
      label: "Decay",
      value: decay,
      setter: setDecay,
      min: 0.01,
      max: 2,
      step: 0.01,
      unit: "s",
    },
    {
      label: "Sustain",
      value: sustain,
      setter: setSustain,
      min: 0,
      max: 1,
      step: 0.01,
      unit: " Level",
    },
    {
      label: "Release",
      value: release,
      setter: setRelease,
      min: 0.01,
      max: 4,
      step: 0.01,
      unit: "s",
    },
  ];

  // --- Tone.js Initialization and Update Effects ---

  // Effect to Initialize/Update Instrument
  useEffect(() => {
    console.log(`Instrument changing to: ${selectedInstrument}`);
    stopMidi();
    if (synthRef.current) {
      synthRef.current.dispose();
      console.log("Previous synth disposed");
    }
    synthRef.current = null;
    let newSynth: Tone.Instrument<any> | null = null;
    try {
      if (isMonophonicForPolySynth(selectedInstrument)) {
        let Ctor: any = Tone.Synth; // Default constructor
        switch (selectedInstrument) {
          case "AMSynth":
            Ctor = Tone.AMSynth;
            break;
          case "FMSynth":
            Ctor = Tone.FMSynth;
            break;
          case "MembraneSynth":
            Ctor = Tone.MembraneSynth;
            break;
          case "Synth":
          default:
            Ctor = Tone.Synth;
            break;
        }
        newSynth = new Tone.PolySynth(Ctor, { maxPolyphony: 8 });
        // Apply initial settings applicable to PolySynth voices
        newSynth.set({ envelope: { attack, decay, sustain, release } });
        if (
          ["Synth", "AMSynth", "FMSynth", "MembraneSynth"].includes(
            selectedInstrument
          )
        ) {
          newSynth.set({
            oscillator: { type: waveType as any, detune: detune },
          });
        }
      } else if (selectedInstrument === "PluckSynth") {
        newSynth = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.7,
        });
      }

      if (newSynth) {
        synthRef.current = newSynth;
        if (!filterRef.current)
          filterRef.current = new Tone.Filter(filterFrequency, "lowpass");
        if (!vibratoRef.current)
          vibratoRef.current = new Tone.Vibrato({
            frequency: lfoSpeed,
            depth: modulationDepth,
          });
        if (!analyserRef.current)
          analyserRef.current = new Tone.Analyser("waveform", 1024);
        console.log("Connecting audio chain...");
        synthRef.current.chain(
          vibratoRef.current,
          filterRef.current,
          analyserRef.current,
          Tone.Destination
        );
        console.log(`Successfully created/chained: ${selectedInstrument}`);
      } else {
        console.error(`Instrument type "${selectedInstrument}" not handled.`);
      }
    } catch (error) {
      console.error(
        `Failed creating/chaining synth ${selectedInstrument}:`,
        error
      );
      if (newSynth) newSynth.dispose();
      synthRef.current = null;
    }

    return () => {
      console.log(`Cleaning up effect for ${selectedInstrument}`);
      stopMidi();
      if (synthRef.current) {
        synthRef.current.dispose();
        console.log("Synth disposed on cleanup.");
        synthRef.current = null;
      }
    };
  }, [selectedInstrument]);

  // Effect to Update Synth Parameters (ADSR, WaveType, Detune)
  useEffect(() => {
    if (!synthRef.current) return;
    try {
      if (synthRef.current instanceof Tone.PolySynth) {
        const voices = (synthRef.current as any).voices;
        if (voices && Array.isArray(voices)) {
          voices.forEach((voice: any) => {
            voice.set({
              envelope: { attack, decay, sustain, release },
              oscillator: { type: waveType, detune: detune },
            });
          });
        } else {
          // Fallback if voices isn't defined
          synthRef.current.set({
            envelope: { attack, decay, sustain, release },
            oscillator: { type: waveType, detune: detune },
          });
        }
      } else if (synthRef.current instanceof Tone.PluckSynth) {
        // For PluckSynth, parameters are not directly mappable.
      }
    } catch (e) {
      console.error("Could not set some synth options:", e);
    }
  }, [waveType, attack, decay, sustain, release, detune]);

  // Other parameter update effects (Filter, Vibrato, Tempo)
  useEffect(() => {
    filterRef.current?.frequency.rampTo(filterFrequency, 0.05);
  }, [filterFrequency]);
  useEffect(() => {
    vibratoRef.current?.set({ frequency: lfoSpeed, depth: modulationDepth });
  }, [modulationDepth, lfoSpeed]);
  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  // --- Core Logic Functions ---

  // WAVEFORM VISUALIZATION FUNCTION
  const animate = () => {
    if (animationRef.current === null) return;
    if (!analyserRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buffer = analyser.getValue();
    if (!buffer || !(buffer instanceof Float32Array) || buffer.length === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(17, 24, 39, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const glowColor = "#2dd4bf";
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.strokeStyle = glowColor;
    ctx.beginPath();
    const sliceWidth = (canvas.width * 1.0) / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const val = buffer[i];
      const y = (1 - (val + 1) / 2) * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    if (animationRef.current !== null) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Form submission handler
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setMidiData(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      if (data.midi && typeof data.midi === "string") {
        const notes = extractABCNotes(data.midi);
        if (notes.length > 0) {
          await Tone.start();
          setMidiData(notes);
        } else {
          console.warn("No valid notes extracted.");
        }
      } else {
        console.warn("No MIDI data string in response.");
      }
    } catch (error) {
      console.error("Error generating/processing MIDI:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Extract musical notes
  const extractABCNotes = (midiText: string): string[] => {
    if (!midiText || typeof midiText !== "string") return [];
    const notes = midiText.match(/[A-G][#b]?\d/gi);
    return notes ? notes.map((n) => n.toUpperCase()) : [];
  };

  // --- Playback Control Functions ---

  // Start looping the MIDI sequence
  async function startLoop() {
    if (isPlaying || !midiData || midiData.length === 0 || !synthRef.current) {
      console.log("StartLoop condition not met.");
      return;
    }
    try {
      await Tone.start();
      console.log("Running stopMidi before starting loop...");
      stopMidi();
      console.log("Proceeding with startLoop...");
      setIsPlaying(true);
      setIsLooping(true);
      if (animationRef.current === null) {
        console.log("Requesting animation frame (startLoop)");
        animationRef.current = requestAnimationFrame(animate);
      }
      loopRef.current?.stop();
      loopRef.current?.dispose();
      loopRef.current = null;
      let index = 0;
      console.log("Creating Tone.Loop...");
      loopRef.current = new Tone.Loop((time) => {
        if (!synthRef.current || !midiData || midiData.length === 0) {
          console.warn("Loop callback condition failed.");
          loopRef.current?.stop();
          stopMidi();
          return;
        }
        const note = midiData[index % midiData.length];
        try {
          if (synthRef.current) {
            synthRef.current.triggerAttackRelease(note, "8n", time);
          } else {
            console.warn("Loop Tick: synthRef null!");
            loopRef.current?.stop();
            stopMidi();
            return;
          }
        } catch (e) {
          console.error(`Error in triggerAttackRelease ('${note}') loop:`, e);
          loopRef.current?.stop();
          stopMidi();
          return;
        }
        index++;
      }, "8n").start(0);
      console.log("Loop object created/started.");
      console.log("Starting Tone.Transport...");
      Tone.Transport.start(Tone.now());
      console.log("Tone.Transport started.");
    } catch (error) {
      console.error("Error during startLoop setup:", error);
      stopMidi();
    }
  }

  // Stop loop (calls stopMidi)
  function stopLoop() {
    console.log("Stopping loop via toggle button...");
    stopMidi();
  }

  // Stop all MIDI playback
  function stopMidi() {
    if (
      !isPlaying &&
      !isLooping &&
      animationRef.current === null &&
      Tone.Transport.state !== "started"
    ) {
      return;
    }
    console.log("Running stopMidi... State:", {
      isPlaying,
      isLooping,
      transport: Tone.Transport.state,
    });
    Tone.Transport.stop();
    Tone.Transport.cancel();
    partRef.current?.stop();
    partRef.current?.dispose();
    partRef.current = null;
    loopRef.current?.stop();
    if (animationRef.current !== null) {
      console.log("Cancelling animation frame", animationRef.current);
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (synthRef.current && synthRef.current instanceof Tone.PolySynth) {
      try {
        console.log("Calling releaseAll on PolySynth");
        synthRef.current.releaseAll();
      } catch (e) {
        console.warn("Error calling releaseAll:", e);
      }
    } else {
      console.log("Skipping releaseAll");
    }
    if (isPlaying || isLooping) {
      setIsPlaying(false);
      setIsLooping(false);
      console.log("Playback states reset");
    } else {
      console.log("Playback states were already false");
    }
  }

  // Randomize settings
  function randomizeSettings() {
    console.log("Randomizing settings...");
    const waveTypes = ["sine", "square", "sawtooth", "triangle"];
    setWaveType(waveTypes[Math.floor(Math.random() * waveTypes.length)]);
    const random = (max = 1) => parseFloat((Math.random() * max).toFixed(2));
    setFilterFrequency(Math.floor(Math.random() * 14981) + 20);
    setAttack(random(0.5) + 0.01);
    setDecay(random(1) + 0.01);
    setSustain(random(1)); // Sustain is 0-1
    setRelease(random(3) + 0.01); // Allow longer release up to ~3s
    setDetune(Math.floor(Math.random() * 25 - 12) * 100);
    setModulationDepth(random());
    setLfoSpeed(parseFloat((Math.random() * 19.9 + 0.1).toFixed(1)));
    setTempo(Math.floor(Math.random() * 181) + 60);
    const randomInstrument =
      instrumentOptions[Math.floor(Math.random() * instrumentOptions.length)]
        .value;
    setSelectedInstrument(randomInstrument);
  }

  // --- JSX Rendering ---
  // Define relevance flags before return
  const isOscillatorRelevant = [
    "Synth",
    "AMSynth",
    "FMSynth",
    "MembraneSynth",
  ].includes(selectedInstrument);
  const isEnvelopeRelevant = isMonophonicForPolySynth(selectedInstrument);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 border border-gray-700">
        {/* Header */}
        <header>
          <div className="flex items-center space-x-4 mb-6 border-b border-gray-700 pb-4">
            <Music className="w-8 h-8 text-indigo-400 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-100">
                AI MIDI Generator & Synth
              </h1>
              <p className="text-sm text-gray-400">
                Describe, generate, tweak.
              </p>
            </div>
          </div>
        </header>

        {/* MIDI Generation Form */}
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors duration-200 shadow-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate MIDI"}
            </button>
          </form>
        </section>

        {/* Playback Controls, Visualization, and Settings */}
        <section className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Playback & Sound Design
          </h2>
          {/* Single Toggle Button for Looping Playback */}
          <div className="flex flex-wrap gap-3 mb-5 border-b border-gray-700 pb-4">
            <button
              onClick={isLooping ? stopLoop : startLoop}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!midiData?.length}
            >
              {isLooping ? "Stop Loop" : "Start Loop"}
            </button>
            <button
              onClick={randomizeSettings}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-md transition-colors duration-200 shadow-md"
            >
              Randomize
            </button>
          </div>
          {/* Waveform Canvas */}
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
          {/* Synth Settings UI */}
          <div className="text-left">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Sound Parameters
            </h3>
            <div className="mb-5">
              <label
                htmlFor="instrumentSelect"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Instrument
              </label>
              <select
                id="instrumentSelect"
                value={selectedInstrument}
                onChange={(event) => setSelectedInstrument(event.target.value)}
                className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 transition"
              >
                {instrumentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div
                className={`space-y-1 transition-opacity duration-300 ${
                  !isOscillatorRelevant ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <label
                  htmlFor="waveType"
                  className="block text-sm font-medium text-gray-400"
                >
                  Wave Type <span className="text-xs">(Core Sound)</span>
                </label>
                <select
                  id="waveType"
                  value={waveType}
                  onChange={(event) => setWaveType(event.target.value)}
                  className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2 disabled:cursor-not-allowed disabled:text-gray-500 transition"
                  disabled={!isOscillatorRelevant}
                  title={
                    !isOscillatorRelevant
                      ? "Wave type not applicable to this instrument"
                      : ""
                  }
                >
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                  <option value="triangle">Triangle</option>
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="filterFrequency"
                  className="block text-sm font-medium text-gray-400"
                >
                  Filter Cutoff ({filterFrequency} Hz)
                </label>
                <input
                  type="range"
                  id="filterFrequency"
                  min="20"
                  max="20000"
                  step="10"
                  value={filterFrequency}
                  onChange={(event) =>
                    setFilterFrequency(Number(event.target.value))
                  }
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500"
                />
              </div>
              <div
                className={`space-y-1 transition-opacity duration-300 ${
                  !isOscillatorRelevant ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <label
                  htmlFor="detune"
                  className="block text-sm font-medium text-gray-400"
                >
                  Detune ({(detune / 100).toFixed(1)} st)
                </label>
                <input
                  type="range"
                  id="detune"
                  min={-1200}
                  max={1200}
                  step={100}
                  value={detune}
                  onChange={(event) => setDetune(Number(event.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500 disabled:cursor-not-allowed disabled:accent-gray-500"
                  disabled={!isOscillatorRelevant}
                  title={
                    !isOscillatorRelevant
                      ? "Detune not applicable to this instrument"
                      : ""
                  }
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="tempo"
                  className="block text-sm font-medium text-gray-400"
                >
                  Tempo ({tempo} BPM)
                </label>
                <input
                  id="tempo"
                  type="range"
                  min="40"
                  max="240"
                  step="1"
                  value={tempo}
                  onChange={(event) => setTempo(Number(event.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="modulationDepth"
                  className="block text-sm font-medium text-gray-400"
                >
                  Vibrato Depth ({modulationDepth.toFixed(2)})
                </label>
                <input
                  type="range"
                  id="modulationDepth"
                  min={0}
                  max={1}
                  step={0.01}
                  value={modulationDepth}
                  onChange={(event) =>
                    setModulationDepth(Number(event.target.value))
                  }
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="lfoSpeed"
                  className="block text-sm font-medium text-gray-400"
                >
                  Vibrato Speed ({lfoSpeed.toFixed(1)} Hz)
                </label>
                <input
                  type="range"
                  id="lfoSpeed"
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={lfoSpeed}
                  onChange={(event) => setLfoSpeed(Number(event.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500"
                />
              </div>
            </div>
            <h4
              className={`mt-6 text-md font-semibold mb-2 text-white transition-opacity duration-300 ${
                !isEnvelopeRelevant ? "opacity-50" : ""
              }`}
            >
              Amplitude Envelope <span className="text-xs">(ADSR Shape)</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              {envelopeInputs.map(
                ({ label, value, setter, min, max, step, unit }) => (
                  <div
                    key={label}
                    className={`space-y-1 transition-opacity duration-300 ${
                      !isEnvelopeRelevant ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <label
                      htmlFor={label}
                      className="block text-sm font-medium text-gray-400"
                    >
                      {label} ({value.toFixed(2)}
                      {unit})
                    </label>
                    <input
                      type="range"
                      id={label}
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(event) => setter(Number(event.target.value))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500 disabled:cursor-not-allowed disabled:accent-gray-500"
                      disabled={!isEnvelopeRelevant}
                      title={
                        !isEnvelopeRelevant
                          ? `Envelope ${label} not directly applicable to ${selectedInstrument}`
                          : ""
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
