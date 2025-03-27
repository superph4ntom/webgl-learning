"use client";

import { useState, useRef, useEffect } from "react";
import { Music } from "lucide-react";
// import * as Tone from "tone";

export default function Home() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [midiData, setMidiData] = useState<string[] | null>([
    "A2",
    "D3",
    "E3",
    "C1",
    "G2",
    "C3",
    "E3",
    "C1",
    "A2",
    "D3",
    "E3",
    "C1",
    "G2",
    "C3",
    "E3",
    "C1",
    "A2",
    "D3",
    "E3",
    "C1",
    "G2",
    "C3",
    "E3",
    "C1",
  ]);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Synth settings
  const [waveType, setWaveType] = useState("sine");
  const [modulationType, setModulationType] = useState("sine"); // Not fully applied, but available
  const [filterFrequency, setFilterFrequency] = useState(800);

  // Envelope
  const [attack, setAttack] = useState(0.05);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.5);
  const [release, setRelease] = useState(0.5);

  // LFO
  const [modulationDepth, setModulationDepth] = useState(0.5);
  const [lfoSpeed, setLfoSpeed] = useState(1);

  // Tempo
  const [tempo, setTempo] = useState(120);

  // Tone.js Refs
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const lfoRef = useRef<Tone.LFO | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Helper boolean to check if we actually have notes
  const hasMidi = midiData && midiData.length > 0;

  // =========================
  // 1) SETUP: Create Nodes Once
  // =========================
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: waveType },
      envelope: { attack, decay, sustain, release },
    });

    filterRef.current = new Tone.Filter(filterFrequency, "lowpass");
    analyserRef.current = new Tone.Analyser("waveform", 1024);

    lfoRef.current = new Tone.LFO(
      lfoSpeed,
      -modulationDepth,
      modulationDepth
    ).start();

    // Connect the LFO to each voice’s oscillator frequency (initially)
    if (synthRef.current?.voices) {
      synthRef.current.voices.forEach((voice: any) => {
        if (voice?.oscillator?.frequency) {
          lfoRef.current?.connect(voice.oscillator.frequency);
        }
      });
    }

    // Chain: synth -> filter -> analyser -> destination
    synthRef.current.chain(
      filterRef.current,
      analyserRef.current,
      Tone.Destination
    );

    // Set the global Transport tempo
    Tone.Transport.bpm.value = tempo;

    // Cleanup on unmount
    return () => {
      stopMidi();
      if (synthRef.current) synthRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
      if (analyserRef.current) analyserRef.current.dispose();
      if (lfoRef.current) lfoRef.current.dispose();
      if (loopRef.current) loopRef.current.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // 2) LIVE PARAM UPDATES
  // =========================
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        oscillator: { type: waveType },
        envelope: { attack, decay, sustain, release },
        modulation: { type: modulationType },
      });
    }
  }, [waveType, attack, decay, sustain, release, modulationType]);

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFrequency;
    }
  }, [filterFrequency]);

  useEffect(() => {
    if (lfoRef.current) {
      lfoRef.current.min = -modulationDepth;
      lfoRef.current.max = modulationDepth;
      lfoRef.current.frequency.value = lfoSpeed;
    }
  }, [modulationDepth, lfoSpeed]);

  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  // If new voices appear, re-connect LFO
  useEffect(() => {
    if (synthRef.current?.voices) {
      synthRef.current.voices.forEach((voice: any) => {
        if (voice?.oscillator?.frequency) {
          lfoRef.current?.connect(voice.oscillator.frequency);
        }
      });
    }
  }, [synthRef.current?.voices]);

  // =========================
  // 3) ANIMATION / VISUALIZATION
  // =========================
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

  // =========================
  // 4) DATA FETCH & PARSE
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();
      if (data.midi) {
        console.log(data.midi);
        const sanitizedNotes = extractABCNotes(data.midi);

        console.log(sanitizedNotes);
        setMidiData(sanitizedNotes);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractABCNotes = (midiText: string): string[] => {
    return midiText
      .replace(/[\[\]|]/g, " ") // Remove brackets and bars
      .replace(/\s+/g, " ") // Normalize spaces
      .trim()
      .split(/,\s*/) // Split by commas and spaces
      .filter((note) => /^[A-G][#b]?[0-9]$/.test(note)); // Match MIDI-style notes
  };

  // =========================
  // 5) ONE-SHOT PLAY
  // =========================
  const playMidi = async () => {
    if (!hasMidi || isPlaying) return;

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
  };

  // =========================
  // 6) LOOP
  // =========================
  const startLoop = () => {
    if (!hasMidi) return;

    if (!loopRef.current) {
      let index = 0;
      loopRef.current = new Tone.Loop((time) => {
        if (!midiData || midiData.length === 0) return;
        const note = midiData[index % midiData.length];
        synthRef.current?.triggerAttackRelease(note, "8n", time);
        index++;
      }, "8n");
    }
    (loopRef.current as any)._index = 0;

    loopRef.current.start(0);
    Tone.Transport.start();
    setIsLooping(true);
    animationRef.current = requestAnimationFrame(animate);
    setIsPlaying(true);
  };

  const stopLoop = () => {
    if (loopRef.current) {
      loopRef.current.stop();
    }
    setIsLooping(false);
  };

  // =========================
  // 7) STOP EVERYTHING
  // =========================
  const stopMidi = () => {
    Tone.Transport.stop();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (isLooping) {
      stopLoop();
    }

    setIsPlaying(false);
  };

  const randomizeSettings = () => {
    const waveTypes = ["sine", "square", "sawtooth", "triangle"];
    const modulationTypes = ["sine", "square", "sawtooth", "triangle"];

    setWaveType(waveTypes[Math.floor(Math.random() * waveTypes.length)]);
    setModulationType(
      modulationTypes[Math.floor(Math.random() * modulationTypes.length)]
    );
    setFilterFrequency(Math.floor(Math.random() * (2000 - 20 + 1)) + 20);
    setAttack(Math.random());
    setDecay(Math.random());
    setSustain(Math.random());
    setRelease(Math.random());
    setModulationDepth(Math.random());
    setLfoSpeed(parseFloat((Math.random() * (10 - 0.1) + 0.1).toFixed(1)));
    setTempo(Math.floor(Math.random() * (200 - 40 + 1)) + 40);
  };

  return (
    <main className="container">
      <div className="content">
        <div className="header">
          <Music className="icon" />
          <h1 className="title">Song to MIDI Generator</h1>
          <p className="description">
            Describe your song idea and let AI create a MIDI composition for you
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="form">
            <textarea
              placeholder="Describe your song (e.g., 'A gentle piano melody with a soft jazz feel')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
            />
            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate MIDI"}
            </button>
          </form>
        </div>

        {/* Always show "Your Generated MIDI" */}
        <div className="result-card">
          <h2 className="title">Your Generated MIDI</h2>

          {/* Playback controls are always shown, but disabled if no notes */}
          <div className="button-group">
            <button
              onClick={playMidi}
              className="play-button"
              disabled={!hasMidi || isPlaying}
            >
              Play Once
            </button>
            {!isLooping ? (
              <button
                onClick={startLoop}
                className="play-button"
                disabled={!hasMidi || isPlaying}
              >
                Start Loop
              </button>
            ) : (
              <button onClick={stopLoop} className="stop-button">
                Stop Loop
              </button>
            )}
            <button
              onClick={stopMidi}
              className="stop-button"
              disabled={!hasMidi && !isPlaying}
            >
              Stop All
            </button>
            <button onClick={randomizeSettings} className="button">
              Randomize Settings
            </button>
          </div>

          {/* Synth Controls below the "Generated MIDI" section */}
          <div className="controls" style={{ textAlign: "left" }}>
            <h2>Synth Settings</h2>
            <div className="control-group">
              <label>Wave Type</label>
              <select
                value={waveType}
                onChange={(e) => setWaveType(e.target.value)}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>

            <div className="control-group">
              <label>Modulation Type</label>
              <select
                value={modulationType}
                onChange={(e) => setModulationType(e.target.value)}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>

            <div className="control-group">
              <label>Filter Frequency</label>
              <input
                type="range"
                min="20"
                max="2000"
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(Number(e.target.value))}
              />
              <span>{filterFrequency} Hz</span>
            </div>

            <h3>Envelope Settings</h3>
            <div className="control-group">
              <label>Attack</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={attack}
                onChange={(e) => setAttack(Number(e.target.value))}
              />
              <span>{attack}</span>
            </div>
            <div className="control-group">
              <label>Decay</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={decay}
                onChange={(e) => setDecay(Number(e.target.value))}
              />
              <span>{decay}</span>
            </div>
            <div className="control-group">
              <label>Sustain</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sustain}
                onChange={(e) => setSustain(Number(e.target.value))}
              />
              <span>{sustain}</span>
            </div>
            <div className="control-group">
              <label>Release</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={release}
                onChange={(e) => setRelease(Number(e.target.value))}
              />
              <span>{release}</span>
            </div>

            <h3>Modulation Controls</h3>
            <div className="control-group">
              <label>Modulation Depth</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={modulationDepth}
                onChange={(e) => setModulationDepth(Number(e.target.value))}
              />
              <span>{modulationDepth}</span>
            </div>
            <div className="control-group">
              <label>LFO Speed (Hz)</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={lfoSpeed}
                onChange={(e) => setLfoSpeed(Number(e.target.value))}
              />
              <span>{lfoSpeed} Hz</span>
            </div>

            <h3>Tempo</h3>
            <div className="control-group">
              <label>Tempo (BPM)</label>
              <input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Show the canvas only if we have notes */}
          {hasMidi && (
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              style={{ border: "1px solid #ccc", marginTop: "1rem" }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
