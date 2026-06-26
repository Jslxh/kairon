from embeddings import generate_embeddings
from vector_store import search
from llm import generate_response


class Kairon:

    def ask(self, question, user_id="default"):

        query_vector = generate_embeddings(
            [question]
        )[0]

        results = search(query_vector, user_id=user_id)

        context = "\n\n".join(
            result.payload["text"]
            for result in results
        )

        prompt = f"""
        You are Kairon AI, a career twin digital assistant.
        
        Answer the user's question ONLY using the provided context from the user's uploaded profile/documents.
        Do NOT make up any details or use external knowledge about projects like ZORO, ACADRAG, TREXO, Zentrix AI, or specific candidates, unless they are explicitly described in the context below.

        If the context is empty, or if the context does not contain the information required to answer the question, you MUST respond exactly with:
        "I cannot find this information in your uploaded profile and documents."

        Context:
        {context}

        Question:
        {question}
        """

        return generate_response(prompt)