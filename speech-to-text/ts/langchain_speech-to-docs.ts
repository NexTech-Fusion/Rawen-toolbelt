import { OpenAIWhisperAudio } from "langchain/document_loaders/fs/openai_whisper_audio";
import { ClientOptions } from "openai";

export function speechToDocs(filePath: string, clientOptions?: ClientOptions) {
    const loader = new OpenAIWhisperAudio(filePath, { clientOptions });
    return loader.load();
}
