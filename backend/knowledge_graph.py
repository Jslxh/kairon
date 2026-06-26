from neo4j import GraphDatabase

from config import (
    NEO4J_URI,
    NEO4J_USER,
    NEO4J_PASSWORD
)


class KnowledgeGraph:

    def __init__(self):

        self.driver = GraphDatabase.driver(
            NEO4J_URI,
            auth=(
                NEO4J_USER,
                NEO4J_PASSWORD
            )
        )

    def close(self):
        self.driver.close()

    def clear_graph(self, user_id="default"):

        query = """
        MATCH (n {user_id: $user_id})
        DETACH DELETE n
        """

        with self.driver.session() as session:
            session.run(query, user_id=user_id)

    def create_skill_project_relation(
        self,
        skill,
        project,
        user_id="default"
    ):

        query = """
        MERGE (s:Skill {name:$skill, user_id:$user_id})
        MERGE (p:Project {name:$project, user_id:$user_id})

        MERGE (s)-[:USED_IN {user_id:$user_id}]->(p)
        """

        with self.driver.session() as session:

            session.run(
                query,
                skill=skill,
                project=project,
                user_id=user_id
            )

    def get_projects_for_skill(
        self,
        skill,
        user_id="default"
    ):

        query = """
        MATCH (s:Skill {name:$skill, user_id:$user_id})
              -[:USED_IN {user_id:$user_id}]->
              (p:Project {user_id:$user_id})

        RETURN p.name AS project
        """

        with self.driver.session() as session:

            result = session.run(
                query,
                skill=skill,
                user_id=user_id
            )

            return [
                record.get("project", "")
                for record in result if record is not None
            ]

    def get_skills_for_project(
        self,
        project,
        user_id="default"
    ):

        query = """
        MATCH (s:Skill {user_id:$user_id})
              -[:USED_IN {user_id:$user_id}]->
              (p:Project {name:$project, user_id:$user_id})

        RETURN s.name AS skill
        """

        with self.driver.session() as session:

            result = session.run(
                query,
                project=project,
                user_id=user_id
            )

            return [
                record.get("skill", "")
                for record in result if record is not None
            ]

    def create_project(self, project, description="", user_id="default"):
        query = """
        MERGE (p:Project {name:$project, user_id:$user_id})
        SET p.description = $description
        """
        with self.driver.session() as session:
            session.run(query, project=project, description=description, user_id=user_id)

    def create_certification(self, certification, user_id="default"):
        query = """
        MERGE (c:Certification {name:$certification, user_id:$user_id})
        """
        with self.driver.session() as session:
            session.run(query, certification=certification, user_id=user_id)

    def create_experience(self, role, company, duration, user_id="default"):
        query = """
        MERGE (e:Experience {role:$role, company:$company, duration:$duration, user_id:$user_id})
        """
        with self.driver.session() as session:
            session.run(query, role=role, company=company, duration=duration, user_id=user_id)

    def create_education(self, school, degree, field_of_study, duration, user_id="default"):
        query = """
        MERGE (e:Education {school:$school, degree:$degree, field_of_study:$field_of_study, duration:$duration, user_id:$user_id})
        """
        with self.driver.session() as session:
            session.run(query, school=school, degree=degree, field_of_study=field_of_study, duration=duration, user_id=user_id)

    def create_project_skill_relation(self, project, skill, user_id="default"):
        query = """
        MERGE (p:Project {name:$project, user_id:$user_id})
        MERGE (s:Skill {name:$skill, user_id:$user_id})
        MERGE (p)-[:USES_SKILL {user_id:$user_id}]->(s)
        """
        with self.driver.session() as session:
            session.run(query, project=project, skill=skill, user_id=user_id)

    def create_role_skill_relation(self, role, skill, user_id="default"):
        query = """
        MERGE (r:Role {name:$role, user_id:$user_id})
        MERGE (s:Skill {name:$skill, user_id:$user_id})
        MERGE (r)-[:REQUIRES_SKILL {user_id:$user_id}]->(s)
        """
        with self.driver.session() as session:
            session.run(query, role=role, skill=skill, user_id=user_id)

    def create_certification_skill_relation(self, certification, skill, user_id="default"):
        query = """
        MERGE (c:Certification {name:$certification, user_id:$user_id})
        MERGE (s:Skill {name:$skill, user_id:$user_id})
        MERGE (c)-[:VALIDATES_SKILL {user_id:$user_id}]->(s)
        """
        with self.driver.session() as session:
            session.run(query, certification=certification, skill=skill, user_id=user_id)