import { speech2txt } from "../open_speech-to-txt";
const audioFilePath = 'assets/audio-test.wav';

console.time('speech2txt');
speech2txt(audioFilePath).then((docs) => {
    console.log(docs);
    console.timeEnd('speech2txt');
});