import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `ou are a music composer like Aaron Hibell, DJ Tiesto, and know everything about harmony, melody, and rhythm. Generate a brutal, beautiful melody using ABC notation, adding a variety of beautiful tones based on the following description: ${description}.\n\n## **Rules for Melody Construction**\n\n### **1. Key Selection & Harmonic Foundation**\n- Use emotional and euphoric minor keys like:\n  - **D# Minor** (D#m - B - F# - C#) → Powerful, driving energy.\n  - **A# Minor** (A#m - F# - C# - G#) → Dark, melancholic yet uplifting.\n  - **F# Minor** (F#m - D - A - E) → Deep, haunting yet euphoric.\n  - **C Minor** (Cm - Ab - Eb - Bb) → Great for cinematic and dramatic tension.\n- Prefer progressions that **evoke emotion**:\n  - **I - V - vi - IV** (e.g., C - G - Am - F) → Classic uplifting pattern.\n  - **vi - IV - I - V** (e.g., Am - F - C - G) → Common in trance and progressive.\n  - **i - VII - VI - VII** (e.g., D#m - C# - B - C#) → Rolling energy, smooth tension and release.\n\n### **2. Note Selection & Melodic Structure**\n- Use **a wide range of tones**:\n  - Deep bass notes: **C2, G1, F1** for grounding.\n  - Midrange body: **D#3, A#3, F#3** for melody richness.\n  - High soaring notes: **A5, C6, D6** for epic impact.\n- **Main Melody Principles:**\n  - Start in midrange (A3 - C4) to introduce motif.\n  - Build energy by ascending towards **higher octaves** in choruses.\n  - Use **passing tones** (grace notes) for natural movement.\n  - Call & response phrasing (e.g., repeat motifs with variation).\n\n### **3. Rhythmic Groove & Drive**\n- **Bassline Rules:**\n  - Use triplet-based rhythms for rolling energy.\n  - Syncopate notes to create a dynamic groove.\n  - Leave room for sidechain compression with kick drum.\n- **Lead Melody Rhythms:**\n  - Mix **long sustained notes** (A5...) with fast runs (C4, D4, E4, A4).\n  - Add 16th-note syncopation for movement.\n  - Build tension with **repeating rhythmic patterns** before the drop.\n\n### **4. Output Format (ABC Notation Rules)**\n- **Only output the ABC notation**, nothing else.\n- Format each note as **LetterNumber** (e.g., A5, C1, D2).\n- Separate notes with **commas**.\n- **Ensure variety** in tone selection while maintaining musicality.\n- Generate at least **8 bars of melody**, ensuring a logical flow.\n- **Maintain key and harmonic coherence** throughout.\n\nNow, generate the melody based on these rules.`,
        },
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ midi: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate MIDI" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic"; // Ensures this runs as a server function
