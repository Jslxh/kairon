from langchain_text_splitters import RecursiveCharacterTextSplitter


def create_chunks(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    chunks = splitter.split_text(text)

    return chunks


if __name__ == "__main__":

    sample_text = """
    Python is a programming language.
    Machine Learning is used in AI.
    RAG combines retrieval and generation.
    """

    chunks = create_chunks(sample_text)

    for i, chunk in enumerate(chunks):
        print(f"\nChunk {i+1}")
        print(chunk)