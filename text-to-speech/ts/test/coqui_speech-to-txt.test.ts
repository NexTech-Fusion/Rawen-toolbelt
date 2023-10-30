import { env } from "process";
import { text2speech } from "../coqui_text-to-speech-api";
import dotenv from 'dotenv';
dotenv.config();

console.time('textToSpeech');

console.log(process.env.COQUI_API_KEY);
text2speech("Hallo, mein name ist Dominic und ich teste coqui", {
    apiKey: env.COQUI_API_KEY,
}).then((res) => {
    console.log(res);
    console.timeEnd('textToSpeech');
});