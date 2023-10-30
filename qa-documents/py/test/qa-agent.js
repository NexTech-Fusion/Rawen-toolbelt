const { spawn } = require('child_process');

const question = "Who created haystack?";
const documents = '[{"content": "Open-source LLM framework to build production-ready applicationsUse the latest LLMs: hosted models by OpenAI or Cohere, open-source LLMs, or other pre-trained modelsAll tooling in one place: preprocessing, pipelines, agents & tools, prompts, evaluation ", "meta": {"name": "Document 1"}}, {"content": "Document content 2 this - Haystack was created by deepestAi", "meta": {"name": "Document 2"}}]';

const process1 = spawn('python', ['scripts/qa-agent.py', '--question', question, '--documents', documents]);

process1.stdout.on('data', (data) => {
    console.log(`Question Response: ${data}`);
});

process1.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
});