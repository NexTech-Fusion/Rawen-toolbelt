import { spawn } from "child_process";

const text = "Hallo, my name is Dominic and i am testing bark";
const voice = "v2/en_speaker_6";

const process1 = spawn('python', [
    'text-to-speech/py/bark-text-to-speech.py',
    text,
    "--voice",
    voice
]);

console.time('text2speech');
process1.stdout.on('data', (data) => {
    console.log(`Audio saved successfully: ${data}`);
    console.timeEnd('text2speech');
});

process1.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});
