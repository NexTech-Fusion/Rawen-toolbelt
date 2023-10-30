import { spawn } from "child_process";

const audioFilePath = 'assets/audio-test.wav';
const whisperModel = 'base';
const filePath = 'speech-to-text/py/openai-whisper.py';
const process1 = spawn('python', [filePath, audioFilePath, '--model', whisperModel]);

console.time('speech2txt');
process1.stdout.on('data', (data) => {
    console.log(`Transcription: ${data}`);
    console.time('speech2txt');
});

process1.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});