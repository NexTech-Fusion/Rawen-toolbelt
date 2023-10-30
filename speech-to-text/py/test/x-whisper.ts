const { spawn } = require('child_process');

const audioFilePath = 'assets/audio-test.wav';
// const whisperModel = 'large-v2';
// const whisperModel = 'medium' ;
const whisperModel = 'small';

const process1 = spawn('python', [
    'speech-to-text/py/x-whisper.py',
    audioFilePath,
    '--model',
    whisperModel,
    '--compute_type', 'int8',
    '--batch_size', '16'
]);

console.time('speech2txt');
process1.stdout.on('data', (data) => {
    console.log(`Transcription: ${data}`);
    console.timeEnd('speech2txt');
});

process1.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});
