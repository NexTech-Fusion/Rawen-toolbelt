import { spawn } from "child_process";

const documents = '[{"content": "Haystack is an end-to-end framework that you can use to build powerful and production-ready pipelines with Large Language Models (LLMs) for different search use cases. Whether you want to perform retrieval-augmented generation (RAG), question answering, or semantic document search, you can use the state-of-the-art LLMs and NLP models in Haystack to provide custom search experiences and make it possible for your users to query in natural language. Haystack is built in a modular fashion so that you can combine the best technology from OpenAI, Cohere, SageMaker, and other open source projects, like Hugging Face, haystack was created by deepestAI", "meta": {"name": "Document 1"}}]';

const process1 = spawn('python', ['summarize/py/haystack_summarize.py', '--documents', documents]);

console.time('summarize');
process1.stdout.on('data', (data) => {
    console.log(`Summarized: ${data}`);
    console.timeEnd('summarize');
});

process1.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});