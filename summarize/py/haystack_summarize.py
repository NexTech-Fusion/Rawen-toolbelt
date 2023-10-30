import argparse
import json 
from typing import List
from haystack.nodes import TransformersSummarizer
from haystack import Document

def summarize(documents: List[Document]):
    try:
        summarizer = TransformersSummarizer(model_name_or_path="facebook/bart-large-cnn")
        summary = summarizer.predict(documents=documents)

        return summary
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Haystack Summarizer")

    parser.add_argument("--documents", type=str,
                        help="JSON string representing a list of documents to summarize")

    args = parser.parse_args()

    if args.documents:
        document_data = json.loads(args.documents)
        documents = [Document(content=item['content']) for item in document_data]
        response = summarize(documents)
        print(response)
    else:
        print("Invalid arguments provided.")
