from rag_engine import Kairon
from graph_query import GraphQuery


class CareerAssistant:

    def __init__(self):

        self.rag = Kairon()
        self.graph = GraphQuery()

    def ask(self, question, user_id="default"):

        q = question.lower()

        # Graph Queries

        if "projects use" in q:

            skill = question.split("use")[-1].strip().rstrip("?.!")

            projects = self.graph.projects_for_skill(
                skill,
                user_id
            )

            if not projects:
                return {
                    "source": "neo4j",
                    "answer": "I cannot find this information in your uploaded profile and documents."
                }

            return {
                "source": "neo4j",
                "answer": projects
            }

        if "skills in" in q:

            project = question.split("in")[-1].strip().rstrip("?.!")

            skills = self.graph.skills_for_project(
                project,
                user_id
            )

            if not skills:
                return {
                    "source": "neo4j",
                    "answer": "I cannot find this information in your uploaded profile and documents."
                }

            return {
                "source": "neo4j",
                "answer": skills
            }

        # Default → RAG

        answer = self.rag.ask(question, user_id)

        return {
            "source": "rag",
            "answer": answer
        }