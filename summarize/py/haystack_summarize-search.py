import argparse
from typing import List
from haystack.document_stores import InMemoryDocumentStore
from haystack.nodes import EmbeddingRetriever
from haystack.nodes import TransformersSummarizer
from haystack import Document
from haystack.pipelines import SearchSummarizationPipeline

document_store = InMemoryDocumentStore(use_bm25=True)

retriever = EmbeddingRetriever(
    document_store=document_store,
    embedding_model="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    use_gpu=True
)

summarizer = TransformersSummarizer(model_name_or_path="facebook/bart-large-cnn")
pipeline = SearchSummarizationPipeline(summarizer=summarizer, retriever=retriever, generate_single_summary=True)

def summarize(question: str, documents: List[dict]):
    try:
        document_store.write_documents(documents)
        document_store.update_embeddings(retriever)
        result = pipeline.run(query=question, params={"Retriever": {"top_k": 5}})
        
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Haystack Search Summarizer")

    parser.add_argument("--search", type=str,
                        help="Specify search query for the summarizer")
    parser.add_argument("--documents", type=str,
                        help="JSON string representing a list of documents to summarize")

    args = parser.parse_args()

    if  args.search and args.documents:
        documents = eval(args.documents)
        response = summarize(args.search, documents)
        print(response)
    else:
        print("Invalid arguments provided.")
