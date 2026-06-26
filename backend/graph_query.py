import os
from knowledge_graph import KnowledgeGraph


class GraphQuery:

    def __init__(self):
        self.kg = KnowledgeGraph()

    def check_and_seed(self, user_id):
        # Disallowed: Do not seed mock/dummy data to comply with strict data integrity rules.
        pass

    def projects_for_skill(self, skill, user_id="default"):
        self.check_and_seed(user_id)
        return self.kg.get_projects_for_skill(skill, user_id)

    def skills_for_project(self, project, user_id="default"):
        self.check_and_seed(user_id)
        return self.kg.get_skills_for_project(project, user_id)

    def get_all_skills(self, user_id="default"):
        self.check_and_seed(user_id)
        query = "MATCH (s:Skill {user_id: $user_id}) RETURN s.name AS name"
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return list(set(record.get("name", "") for record in result if record.get("name") is not None))

    def get_all_projects(self, user_id="default"):
        self.check_and_seed(user_id)
        query = """
        MATCH (p:Project {user_id: $user_id})
        WHERE NOT toLower(p.name) IN ['profile highlights', 'skills index', 'career overview']
        RETURN p.name AS name
        """
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return list(set(record.get("name", "") for record in result if record.get("name") is not None))

    def get_all_certifications(self, user_id="default"):
        self.check_and_seed(user_id)
        query = "MATCH (c:Certification {user_id: $user_id}) RETURN c.name AS name"
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return list(set(record.get("name", "") for record in result if record.get("name") is not None))

    def get_all_experiences(self, user_id="default"):
        self.check_and_seed(user_id)
        query = "MATCH (e:Experience {user_id: $user_id}) RETURN e.role AS role, e.company AS company, e.duration AS duration"
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return [
                {
                    "role": r.get("role", ""),
                    "company": r.get("company", ""),
                    "duration": r.get("duration", "")
                }
                for r in result if r is not None
            ]

    def get_projects_details(self, user_id="default"):
        self.check_and_seed(user_id)
        query = """
        MATCH (p:Project {user_id: $user_id})
        WHERE NOT toLower(p.name) IN ['profile highlights', 'skills index', 'career overview']
        OPTIONAL MATCH (p)-[:USES_SKILL {user_id: $user_id}]->(s:Skill {user_id: $user_id})
        RETURN p.name AS name, p.description AS description,
               collect(s.name) AS skill_names
        """
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            rows = []
            for record in result:
                if record is None:
                    continue
                skill_names = [sn for sn in (record.get("skill_names") or []) if sn]
                rows.append({
                    "name": record.get("name", ""),
                    "description": record.get("description", "") or "Project linked to your digital twin.",
                    "skills": skill_names,
                    "skills_count": len(skill_names)
                })
            return rows

    def get_graph_data(self, user_id="default"):
        self.check_and_seed(user_id)
        # Exclude stale placeholder nodes that were created by older sync-profile code
        placeholder_names = ['profile highlights', 'skills index', 'career overview']
        query = """
        MATCH (source {user_id: $user_id})-[r]->(target {user_id: $user_id})
        WHERE type(r) IN ['USES_SKILL', 'REQUIRES_SKILL', 'VALIDATES_SKILL']
          AND NOT toLower(source.name) IN $placeholders
          AND NOT toLower(target.name) IN $placeholders
        RETURN source.name AS source_name, labels(source)[0] AS source_type,
               type(r) AS rel_type,
               target.name AS target_name, labels(target)[0] AS target_type
        """
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id, placeholders=placeholder_names)
            nodes = set()
            links = []
            for record in result:
                if record is None:
                    continue
                s_name = record.get("source_name", "")
                s_type = record.get("source_type", "")
                t_name = record.get("target_name", "")
                t_type = record.get("target_type", "")
                r_type = record.get("rel_type", "")

                # Relabel relationships for better UX visualization
                rel_label = "USES"
                if r_type == "REQUIRES_SKILL":
                    rel_label = "REQUIRES"
                elif r_type == "VALIDATES_SKILL":
                    rel_label = "VALIDATES"

                if s_name and s_type and t_name and t_type:
                    nodes.add((s_name, s_type))
                    nodes.add((t_name, t_type))
                    links.append({
                        "source": s_name,
                        "target": t_name,
                        "type": rel_label
                    })

            # Ensure all primary entity nodes are included (isolated nodes with no links)
            entity_query = """
            MATCH (n {user_id: $user_id})
            WHERE labels(n)[0] IN ['Project', 'Role', 'Certification', 'Skill']
              AND NOT toLower(n.name) IN $placeholders
            RETURN n.name AS name, labels(n)[0] AS label
            """
            entity_result = session.run(entity_query, user_id=user_id, placeholders=placeholder_names)
            for record in entity_result:
                if record:
                    n_name = record.get("name", "")
                    n_label = record.get("label", "")
                    if n_name and n_label:
                        nodes.add((n_name, n_label))

            return {
                "nodes": [{"id": name, "type": ntype} for name, ntype in list(nodes)],
                "links": links
            }

    def get_all_education(self, user_id="default"):
        self.check_and_seed(user_id)
        query = "MATCH (e:Education {user_id: $user_id}) RETURN e.school AS school, e.degree AS degree, e.field_of_study AS field_of_study, e.duration AS duration"
        with self.kg.driver.session() as session:
            result = session.run(query, user_id=user_id)
            return [
                {
                    "school": record.get("school", ""),
                    "degree": record.get("degree", ""),
                    "field_of_study": record.get("field_of_study", ""),
                    "duration": record.get("duration", "")
                }
                for record in result if record is not None
            ]