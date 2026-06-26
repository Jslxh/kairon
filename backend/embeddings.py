from sentence_transformers import SentenceTransformer

# Load embedding model once
model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def generate_embeddings(chunks):
    embeddings = model.encode(chunks)

    return embeddings


if __name__ == "__main__":

    sample_chunks = [
        "Python is a programming language",
        "Machine Learning is part of AI"
    ]

    vectors = generate_embeddings(sample_chunks)

    print("Number of vectors:", len(vectors))
    print("Vector dimension:", len(vectors[0]))