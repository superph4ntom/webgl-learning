"use client";

//import * as Tone from "tone";
import AudioControl from "@/components/audio-control";
import CustomLoopEditor from "@/components/custom-loop-editor";
import GenAIForm from "@/components/gen-ai-form";
import Header from "@/components/header";
import Select from "@/components/select";
import Waveform from "@/components/waveform";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../data/config";

const random = (max = 1) => parseFloat((Math.random() * max).toFixed(2));
const noteOptions = CONFIG.default.noteOptions;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isEnvelopeRelevant, setIsEnvelopeRelevant] = useState(true);
  const [isCustomLoopActive, setIsCustomLoopActive] = useState(false);
  const [description, setDescription] = useState("");
  const [customLoopNotes, setCustomLoopNotes] = useState<string[]>([]);
  const [midiData, setMidiData] = useState<string[] | null>(
    CONFIG.default.midi
  );

  const [selectedInstrument, setSelectedInstrument] = useState<string>(
    CONFIG.instrumentOptions[0].value
  );
  const [waveType, setWaveType] = useState<string>(CONFIG.default.waveType);
  const [filterFrequency, setFilterFrequency] = useState<number>(
    CONFIG.default.filterFrequency
  );

  const [attack, setAttack] = useState<number>(CONFIG.default.attack);
  const [decay, setDecay] = useState<number>(CONFIG.default.decay);
  const [release, setRelease] = useState<number>(CONFIG.default.release);
  const [detune, setDetune] = useState<number>(0);
  const [modulationDepth, setModulationDepth] = useState<number>(0.5);
  const [lfoSpeed, setLfoSpeed] = useState<number>(CONFIG.default.lfoSpeed);
  const [tempo, setTempo] = useState<number>(CONFIG.default.tempo);
  const [sustain, setSustain] = useState<number>(
    Math.min(1, Math.max(0, CONFIG.default.sustain))
  );

  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const vibratoRef = useRef(null);
  const analyserRef = useRef(null);
  const loopRef = useRef(null);
  const partRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(null);

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

  function randomizeSettings() {
    console.log(CONFIG);
    setWaveType(
      CONFIG.waveTypeOptions[
        Math.floor(Math.random() * CONFIG.waveTypeOptions.length)
      ]
    );

    setFilterFrequency(Math.floor(Math.random() * 14981) + 20);
    setAttack(random(0.5) + 0.01);
    setDecay(random(1) + 0.01);
    setSustain(random(1)); // Sustain is 0-1
    setRelease(random(3) + 0.01); // Allow longer release up to ~3s
    setDetune(Math.floor(Math.random() * 25 - 12) * 100);
    setModulationDepth(random());
    setLfoSpeed(parseFloat((Math.random() * 19.9 + 0.1).toFixed(1)));
    setTempo(Math.floor(Math.random() * 181) + 60);
  }

  // updates effects
  useEffect(() => {
    setIsEnvelopeRelevant(selectedInstrument !== "PluckSynth" ? true : false);

    // dispose synth
    if (synthRef.current) {
      stopMidi();
      synthRef.current.dispose();
      synthRef.current = null;
    }

    if (selectedInstrument !== "PluckSynth") {
      synthRef.current = new Tone.PolySynth(Tone[selectedInstrument], {
        maxPolyphony: 8,
        envelope: { attack, decay, sustain, release },
        oscillator: { type: waveType, detune: detune },
      });
    } else {
      synthRef.current = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.7,
      });
    }

    filterRef.current = new Tone.Filter(filterFrequency, "lowpass");

    vibratoRef.current = new Tone.Vibrato({
      frequency: lfoSpeed,
      depth: modulationDepth,
    });

    analyserRef.current = new Tone.Analyser("waveform", 1024);

    synthRef?.current?.chain(
      vibratoRef.current,
      filterRef.current,
      analyserRef.current,
      Tone.Destination
    );

    return () => {
      stopMidi();
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, [selectedInstrument]);

  // update Synth Parameters (ADSR, WaveType, Detune)
  useEffect(() => {
    if (!synthRef.current) return;
    const voices = synthRef.current.voices;

    if (voices) {
      voices.forEach((voice: any) => {
        voice.set({
          envelope: { attack, decay, sustain, release },
          oscillator: { type: waveType, detune: detune },
        });
      });
    } else {
      synthRef.current.set({
        envelope: { attack, decay, sustain, release },
        oscillator: { type: waveType, detune: detune },
      });
    }
  }, [waveType, attack, decay, sustain, release, detune]);

  useEffect(() => {
    filterRef.current?.frequency.rampTo(filterFrequency, 0.05);
  }, [filterFrequency]);

  useEffect(() => {
    vibratoRef.current?.set({ frequency: lfoSpeed, depth: modulationDepth });
  }, [lfoSpeed, modulationDepth]);

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  function animate() {
    const canvas = canvasRef.current.getContext("2d");
    const buffer = analyserRef.current.getValue();
    const sliceWidth = canvasRef.current.width / buffer.length;
    const COLORS = CONFIG.spectrum.colors;

    if (!canvas || !buffer || buffer.length === 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    canvas.strokeStyle = COLORS.glow;
    canvas.shadowColor = COLORS.glow;
    canvas.shadowBlur = COLORS.shadowBlur;
    canvas.fillStyle = COLORS.background;
    canvas.lineWidth = COLORS.lineWidth;

    canvas.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvas.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvas.beginPath();

    let xAxisWidth = 0;
    for (let i = 0; i < buffer.length; i++) {
      const yAxisHeight = (1 - (buffer[i] + 1) / 2) * canvasRef.current.height;
      canvas.lineTo(xAxisWidth, yAxisHeight);
      xAxisWidth += sliceWidth;
    }

    canvas.stroke();
    animationRef.current = requestAnimationFrame(animate);
  }

  async function handleSubmit(event: FormEvent) {
    if (isLoading) return;
    event.preventDefault();

    setIsLoading(true);
    setMidiData(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const { midi } = await response.json();

      if (!response.ok || !midi)
        throw new Error(`API Error: ${response.status}`);

      const notes = formatNotes(midi);

      if (notes.length) {
        await Tone.start();
        setMidiData(notes);
      } else {
        console.warn("No valid notes extracted.");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error generating/processing MIDI:", error);
    }
  }

  const formatNotes = (midiText: string): string[] => {
    const notes = midiText.match(/[A-G][#b]?\d/gi);
    return notes ? notes.map((n) => n.toUpperCase()) : [];
  };

  async function startLoop() {
    const loopNotes =
      isCustomLoopActive && customLoopNotes.length
        ? customLoopNotes
        : midiData || [];

    if (isPlaying || loopNotes.length === 0 || !synthRef.current) return;

    try {
      await Tone.start();
      stopMidi();

      setIsPlaying(true);
      setIsLooping(true);

      if (!animationRef.current)
        animationRef.current = requestAnimationFrame(animate);

      loopRef.current?.stop();
      loopRef.current?.dispose();
      loopRef.current = null;

      let index = 0;
      loopRef.current = new Tone.Loop((time) => {
        if (loopNotes.length === 0) {
          loopRef.current?.stop();
          stopMidi();
          return;
        }

        const note = loopNotes[index % loopNotes.length];
        synthRef.current.triggerAttackRelease(note, "8n", time);

        index++;
      }, "8n").start(0);

      Tone.Transport.start(Tone.now());
    } catch (error) {
      console.error("Error during startLoop setup:", error);
      stopMidi();
    }
  }

  function stopMidi() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    partRef.current?.stop();
    partRef.current?.dispose();
    partRef.current = null;
    loopRef.current?.stop();

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (synthRef.current && synthRef.current instanceof Tone.PolySynth)
      synthRef.current.releaseAll();

    setIsPlaying(false);
    setIsLooping(false);
  }

  const addNote = (note: string) =>
    setCustomLoopNotes((previous) => [...previous, note]);

  const removeNote = (index: number) =>
    setCustomLoopNotes((previous) => previous.filter((_, i) => i !== index));

  const clearCustomLoop = () => setCustomLoopNotes([]);

  const randomizeCustomLoop = () => {
    const count = Math.floor(Math.random() * 5) + 4;
    const newLoop = [];

    for (let i = 0; i < count; i++) {
      const randomNote =
        noteOptions[Math.floor(Math.random() * noteOptions.length)] + "4";
      newLoop.push(randomNote);
    }

    setCustomLoopNotes(newLoop);
  };

  // When hovering over a note, play its preview for one 16th note
  const playPreview = (note: string) =>
    synthRef.current.triggerAttackRelease(note, "16n");

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 border border-gray-700">
        <Header />
        <GenAIForm
          handleSubmit={handleSubmit}
          setDescription={setDescription}
          description={description}
          isLoading={isLoading}
        />

        <section className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Playback & Sound Design
          </h2>

          <AudioControl
            isLooping={isLooping}
            isCustomLoopActive={isCustomLoopActive}
            setIsCustomLoopActive={setIsCustomLoopActive}
            stopMidi={stopMidi}
            startLoop={startLoop}
            randomizeSettings={randomizeSettings}
            customLoopNotes={customLoopNotes}
            midiData={midiData}
          />

          {isCustomLoopActive && (
            <CustomLoopEditor
              addNote={addNote}
              playPreview={playPreview}
              randomizeCustomLoop={randomizeCustomLoop}
              clearCustomLoop={clearCustomLoop}
              removeNote={removeNote}
              customLoopNotes={customLoopNotes}
              noteOptions={noteOptions}
            />
          )}

          <Waveform canvasRef={canvasRef} />

          {/* Synth Settings */}
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

              <Select
                id="Instrument"
                value={selectedInstrument}
                onChange={(event) => setSelectedInstrument(event.target.value)}
                options={CONFIG.instrumentOptions}
                title="Wave type not applicable to this instrument"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div
                className={`space-y-1 transition-opacity duration-300 ${
                  !isEnvelopeRelevant ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <label
                  htmlFor="waveType"
                  className="block text-sm font-medium text-gray-400"
                >
                  Wave Type <span className="text-xs">(Core Sound)</span>
                </label>
                <Select
                  id="waveType"
                  value={waveType}
                  onChange={(event) => setWaveType(event.target.value)}
                  options={CONFIG.waveTypeOptions}
                  title="Wave type not applicable to this instrument"
                />
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
                  !isEnvelopeRelevant ? "opacity-50 cursor-not-allowed" : ""
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
                  disabled={!isEnvelopeRelevant}
                  title={
                    !isEnvelopeRelevant
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
