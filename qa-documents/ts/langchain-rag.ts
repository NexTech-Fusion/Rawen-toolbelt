import {
    RetrievalQAChain,
    RefineDocumentsChain,
    LLMChain,
} from "langchain/chains";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PromptTemplate } from "langchain/prompts";
import { AlephAlpha } from "langchain/llms/aleph_alpha";
import { OpenAI } from "langchain/llms/openai";
import { Document } from "langchain/document";

type Providers = "OPENAI" | "ALEPH";

const defaultOpenaiOptions = {
    temperature: 0.1,
    streaming: true,
    modelName: "gpt-3.5-turbo-16k",
};

export async function callRag(
    prompt: string,
    provider: Providers,
    docs: Document[],
    callback: Function,
    abortController: AbortController,
    strict = false
) {
    try {
        switch (provider) {
            case "OPENAI":
                return await callOpenAi(prompt, callback, provider, docs, abortController, strict);
            case "ALEPH":
                return await callAlpeh(prompt, callback, provider, docs, abortController, strict);
            default:
                throw new Error("Invalid LLM type");
        }
    } catch (err) {
        throw err;
    }
}

const ANSWER_INDICATOR = "OA";
const DEFAULT_REFINE_PROMPT_TMPL = `The original question is as follows: {question}
We have provided an existing answer: {existing_answer}
We have the opportunity to refine the existing answer
(only if needed) with some more context below.
------------
{context}
------------
Given the new context, refine the existing answer to better answer the question or 
If the context isn't useful for refining the answer, return the existing answer but with a prefix "${ANSWER_INDICATOR} \n\n".
`;

const refinePrompt = new PromptTemplate({
    inputVariables: ["question", "existing_answer", "context"],
    template: DEFAULT_REFINE_PROMPT_TMPL,
});

// Response to the human by looking at the **Context**.
const questionPromptTemplateString = `
Human: 
{question}

Context:
{context}

Instructions:
You are a helpful assistant, you are all mighty and know close to everything.
If you can answer the question without the Context, response with the answer and prefix your Response with: "${ANSWER_INDICATOR} \n\n".

### Response : 
`;

const questionPromptTemplateStringRag = `Context information is below.
---------------------
{context}
---------------------
Given the context information and no prior knowledge, answer the question: {question}`;

const documentPrompt = new PromptTemplate({
    inputVariables: ["page_content", "file_name", "file_date", "file_type"],
    template: `
     -File_Name : {file_name}
     -File_Date : {file_date}
     -File_Type : {file_type}
     -File_Content : {page_content}
    -----
        `,
});

async function langchainRag(
    query: string,
    model: any,
    docs: any[],
    embeddings: any,
    callback: Function,
    abortController: AbortController,
    strict = false
) {
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    const vectorStoreRetriever = vectorStore.asRetriever();
    const verbose = false;
    const questionPrompt = new PromptTemplate({
        inputVariables: ["context", "question"],
        template: strict ? questionPromptTemplateStringRag : questionPromptTemplateString,
    });

    const combineDocumentsChain = new RefineDocumentsChain({
        llmChain: new LLMChain({ prompt: questionPrompt, llm: model, verbose }),
        refineLLMChain: new LLMChain({ prompt: refinePrompt, llm: model, verbose }),
        verbose,
        documentPrompt,
    });

    const chain = new RetrievalQAChain({
        combineDocumentsChain,
        retriever: vectorStoreRetriever,
        // verbose: true,
        returnSourceDocuments: true,
    });

    let hasAnswer = false;
    let stopCallback = false;
    let collectedText = "";
    let sourceDocuments: any[] = [];
    try {
        let response = await chain.call({ query, signal: abortController.signal }, {
            callbacks: [
                {
                    handleRetrieverEnd(documents: any) {
                        sourceDocuments.push(...documents);
                    },
                    handleLLMStart() {
                        if (hasAnswer) {
                            stopCallback = true;
                            if (abortController) {
                                abortController.abort("Answer found");
                            }
                            return;
                        }
                        hasAnswer = docs.length === 1;
                        collectedText = "";
                    },
                    handleLLMNewToken(token: string) {
                        if (stopCallback) {
                            return;
                        }

                        if (hasAnswer) {
                            collectedText += token;
                            callback(token.replace(ANSWER_INDICATOR, ""));
                        } else {
                            collectedText += token;
                            if (collectedText.includes(ANSWER_INDICATOR)) {
                                collectedText = collectedText.replace(ANSWER_INDICATOR, "");
                                hasAnswer = true;
                            }
                        }
                    },
                },
            ],
        });
        response.output_text = response.output_text.replace(ANSWER_INDICATOR, "");
        return response;
    } catch (err) {
        if (abortController.signal.reason === "Answer found") {
            return {
                output_text: collectedText,
                sourceDocuments
            };
        }
        throw err;
    }
}

async function callOpenAi(
    query: string,
    callback: Function,
    llmSetting: any,
    docs: any,
    signal: AbortController,
    strict = false
) {
    try {
        const openAIApiKey = llmSetting.values["ApiKey"];
        const modelName = llmSetting.values["Model"];
        const opts = { ...defaultOpenaiOptions, openAIApiKey, modelName };

        const embeddings = new OpenAIEmbeddings({ openAIApiKey });
        let model = new OpenAI({
            ...opts,
        });
        const response = await langchainRag(query, model, docs, embeddings, callback, signal, strict);

        return response;
    } catch (err) {
        throw err;
    }
}

const defaultAlephOptions = {
    temperature: 0.1,
    streaming: true,
    model: "luminous-supreme-control",
};

async function callAlpeh(
    query: string,
    callback: Function,
    options: any,
    docs: any,
    abortController: AbortController,
    strict = false
) {
    try {
        const opts = { ...defaultAlephOptions, ...options };
        const model = new AlephAlpha(opts);
        const embeddings = {}; // TODO replace with AlephAlphaEmbeddings

        const response = await langchainRag(query, model, docs, embeddings, callback, abortController, strict);

        return response;
    } catch (err) {
        throw err;
    }
}
