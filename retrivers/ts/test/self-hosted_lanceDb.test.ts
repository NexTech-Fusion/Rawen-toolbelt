import { ingest, retrive, useOpenAiEmbedding } from '../self-hosted_lanceDb';
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.OPENAI_API_KEY;

async function main() {
    console.time('ingest');
    const data = [
        {
            "id": 1,
            "metadata": {
                "title": "Lorem Ipsum Document",
                "author": "John Doe",
                "date": "2023-09-20"
            },
            "pageContent": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac ipsum nec justo consequat dignissim. Nulla facilisi. Integer gravida tincidunt turpis eget iaculis."
        },
        {
            "id": 2,
            "metadata": {
                "title": "Technical Report on AI Ethics",
                "author": "Jane Smith",
                "date": "2023-09-21"
            },
            "pageContent": "This document provides an overview of the ethical considerations surrounding artificial intelligence. It covers topics such as bias in machine learning, data privacy, and responsible AI development."
        },
    ];
    useOpenAiEmbedding(apiKey);
    await ingest({
        data,
        table: 'vectors'
    })

    const retriveData = await retrive({
        table: 'vectors',
        query: 'what is lorem?'
    });

    console.log(retriveData);
    console.timeEnd('ingest');
}

main();