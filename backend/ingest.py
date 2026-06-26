from pdf_loader import load_pdf
from chunker import create_chunks
from embeddings import generate_embeddings
from vector_store import (
    create_collection,
    store_vectors
)

def ingest_resume():

    print("Loading Resume...")

    text = load_pdf("../data/resumes/j_resume.pdf")

    print("Creating Chunks...")

    chunks = create_chunks(text)

    print(f"Total Chunks: {len(chunks)}")

    print("Generating Embeddings...")

    vectors = generate_embeddings(chunks)

    print("Creating Collection...")

    create_collection()

    print("Storing Vectors...")

    store_vectors(chunks, vectors)

    print("Ingestion Complete [OK]")


if __name__ == "__main__":
    ingest_resume()