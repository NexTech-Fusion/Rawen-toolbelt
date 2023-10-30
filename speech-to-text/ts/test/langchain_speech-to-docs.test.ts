import { speechToDocs } from "../langchain_speech-to-docs";

const audioFilePath = 'assets/audio-test.wav';
console.time('speechToDocs');
speechToDocs(audioFilePath).then((docs) => {
    console.log(docs);
    console.timeEnd('speechToDocs');
});