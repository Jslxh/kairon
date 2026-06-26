import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
from config import QDRANT_COLLECTION

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "qdrant_db")


def create_collection():

    client = QdrantClient(path=db_path)
    client.recreate_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(
            size=384,
            distance=Distance.COSINE
        )
    )
    client.close()


def store_vectors(chunks, vectors, user_id="default"):

    points = []

    for i, (chunk, vector) in enumerate(zip(chunks, vectors)):

        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector.tolist(),
                payload={
                    "text": chunk,
                    "user_id": user_id
                }
            )
        )

    client = QdrantClient(path=db_path)
    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=points
    )
    client.close()


def search(query_vector, limit=3, user_id="default"):

    client = QdrantClient(path=db_path)
    response = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector.tolist(),
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id)
                )
            ]
        ),
        limit=limit
    )
    client.close()

    return response.points