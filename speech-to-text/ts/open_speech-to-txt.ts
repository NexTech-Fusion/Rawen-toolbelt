import fs from "fs";
import OpenAI from "openai";

interface Options {
    [key: string]: any;
    apiKey: string;
    model?: string;
}

export async function speech2txt(audioPath: string, options?: Options): Promise<string> {
    try {
        const openai = new OpenAI(options);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: options?.model ?? "whisper-1",
        });

        return transcription.text;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
