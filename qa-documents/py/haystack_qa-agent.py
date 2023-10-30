import argparse
from typing import List
from haystack.document_stores import InMemoryDocumentStore
from haystack.nodes import EmbeddingRetriever, FARMReader
from haystack.pipelines import ExtractiveQAPipeline
from haystack.agents import Agent, Tool
from haystack.nodes import PromptNode
import os

document_store = InMemoryDocumentStore(use_bm25=True)

retriever = EmbeddingRetriever(
    document_store=document_store,
    embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    use_gpu=True
)
document_store.update_embeddings(retriever=retriever)
reader = FARMReader(
    model_name_or_path="deepset/roberta-base-squad2", use_gpu=False)
knowledge = ExtractiveQAPipeline(reader=reader, retriever=retriever)

api_key = os.environ.get('OPENAI_API_KEY')
prompt_node = PromptNode(model_name_or_path="text-davinci-003",
                         api_key=api_key, stop_words=["Observation:"])
agent = Agent(prompt_node=prompt_node)

search_tool = Tool(
    name="KnowledgeBase",
    pipeline_or_node=knowledge,
    description="useful for when you need to answer questions",
    output_variable="answers",
)
agent.add_tool(search_tool)

def ask_question(question: str, documents: List[dict]):
    try:
        document_store.write_documents(documents)
        document_store.update_embeddings(retriever)

        result = agent.run(question)
        answer = result["transcript"].split("---")[0]

        return answer
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Haystack Q&A API")

    parser.add_argument("--question", type=str,
                        help="Question for the Q&A endpoint")
    parser.add_argument("--documents", type=str,
                        help="JSON string representing a list of documents for the Q&A endpoint")

    args = parser.parse_args()

    if args.question and args.documents:
        documents = eval(args.documents)
        response = ask_question(args.question, documents)
        print(response)
    else:
        print("Invalid arguments provided.")
