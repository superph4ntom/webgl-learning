import { OpenAI } from "openai";
import { NextResponse } from "next/server";

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
          content: `You are a music composer like Aaron Hibell, DJ Tiesto and know everyting. Generate a brutal beautiful melody using ABC notation, add always variety of beautiful tones based on the following description: ${description}. Output ONLY the ABC notation, nothing else. Obey to the format of LETTERNUMBER as in A5, C1, D2 having commas to separate them for example. Always add a high variety of tones.`,
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
