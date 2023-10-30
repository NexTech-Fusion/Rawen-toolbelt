import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { SqlDatabaseChain, SqlDatabaseChainInput } from 'langchain/chains/sql_db'
import { createSqlAgent, SqlToolkit } from "langchain/agents/toolkits/sql";
import { DataSource } from "typeorm";

import { RunnableSequence } from "langchain/schema/runnable";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { ChatOpenAI } from "langchain/chat_models/openai";

const ANSWER_INDICATOR = "OA";

const SQL_PREFIX = `You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
If you get a "no such table" error, rewrite your query by using the table in quotes.
DO NOT use a column name that does not exist in the table.
You have access to tools for interacting with the database.
Only use the below tools. Only use the information returned by the below tools to construct your final answer.
DO NOT try to execute the query more than three times.
DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
If the question does not seem related to the database, just return "I don't know" as the answer.
If you cannot find a way to answer the question, just return the best answer you can find after trying at least three times.
When you got the answer, return the answer with a prefix "${ANSWER_INDICATOR} \n\n".
`;

const SQL_SUFFIX = `Begin!
Question: {input}
Thought: I should look at the tables in the database to see what I can query.
{agent_scratchpad}`;

let datasource;
async function connectDb() {
    datasource = new DataSource({
        type: "postgres",
        host: "localhost",
        port: 6543,
        username: "odoo",
        password: "odoo",
        database: "odoo",
    });
}

async function disconnectDb() {
    if (datasource) {
        await datasource.destroy();
    }
}

async function sqlAgentCall(inputText,
    callback: Function,
    abortController: AbortController,
    agentCallback?: Function, options = null) {

    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        ...options
    });

    const model = new OpenAI({
        modelName: "gpt-3.5-turbo-16k",
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0,
        streaming: true
    });
    const toolkit = new SqlToolkit(db, model);

    const executor = createSqlAgent(model, toolkit, {
        prefix: SQL_PREFIX,
        suffix: SQL_SUFFIX,
        topK: 8
    });

    const input = inputText;
    let hasAnswer = false;
    let stopCallback = false;
    let collectedText = "";
    const result = await executor.call({ input, signal: abortController.signal }, {
        callbacks: [
            {
                handleRetrieverEnd(documents: any) {
                },
                handleLLMStart() {
                    if (hasAnswer) {
                        stopCallback = true;
                        if (abortController) {
                            abortController.abort("Answer found");
                        }
                        return;
                    }
                    collectedText = "";
                },
                handleAgentAction(action, runId, parentRunId, tags) {
                    agentCallback && agentCallback(action);
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

    return result.output.replace(ANSWER_INDICATOR, "");
};

async function sqlCall(inputText) {
    const llm = new OpenAI({ modelName: "gpt-3.5-turbo", openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0, verbose: true });
    const datasource = new DataSource({
        type: "postgres",
        host: "localhost",
        port: 6543,
        username: "odoo",
        password: "odoo",
        database: "odoo",
    });
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
    });

    const obj: SqlDatabaseChainInput = {
        llm,
        database: db
    }

    const chain = new SqlDatabaseChain(obj)

    const query = inputText
    const result = await chain.run(query)
    await datasource.destroy();
    return result;
};

async function sqlExperiment(input) {
    const datasource = new DataSource({
        type: "postgres",
        host: "localhost",
        port: 6543,
        username: "odoo",
        password: "odoo",
        database: "odoo",
    });
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        includesTables: ["product_template"]
    });

    const prompt =
        PromptTemplate.fromTemplate(`Based on the table schema below, write a SQL query that would answer the user's question:
      {schema}
      
      Question: {question}
      SQL Query:`);

    const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0, verbose: true });

    const sqlQueryGeneratorChain = RunnableSequence.from([
        {
            schema: async () => db.getTableInfo(),
            question: (input: { question: string }) => input.question,
        },
        prompt,
        model.bind({ stop: ["\nSQLResult:"] }),
        new StringOutputParser(),
    ]);

    const result = await sqlQueryGeneratorChain.invoke({
        question: input,
    });

    console.log(result);

    const finalResponsePrompt =
        PromptTemplate.fromTemplate(`Based on the table schema below, question, sql query, and sql response, write a natural language response:
      {schema}
      
      Question: {question}
      SQL Query: {query}
      SQL Response: {response}`);

    const fullChain = RunnableSequence.from([
        {
            question: (input) => input.question,
            query: sqlQueryGeneratorChain,
        },
        {
            schema: async () => db.getTableInfo(),
            question: (input) => input.question,
            query: (input) => input.query,
            response: (input) => db.run(input.query),
        },
        finalResponsePrompt,
        model,
    ]);

    const finalResponse = await fullChain.invoke({
        question: input,
    });

    return finalResponse.content;
}

module.exports = {
    disconnectDb,
    connectDb,
    sqlAgentCall,
    sqlCall
}
