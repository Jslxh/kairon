import json

from llm import generate_response
from knowledge_graph import KnowledgeGraph


import re

def extract_entities(text):

    prompt = f"""
    Analyze the following resume/candidate profile text and extract key digital twin details.
    You MUST return ONLY a valid JSON object matching the format below.
    Do NOT include markdown wraps (like ```json), commentary, or extra text.

    Required JSON Format:
    {{
        "name": "Full name of the candidate",
        "bio": "A concise 1-2 sentence professional bio summarizing their experience",
        "inferred_role": "Inferred target role based on experience, skills, or projects (e.g. Full Stack Developer, Data Analyst, Cloud Engineer, Product Manager, DevOps Engineer, Software Developer)",
        "skills": ["Skill 1", "Skill 2", ...],
        "projects": [
            {{
                "name": "Project Name (e.g., ZORO, ACADRAG, TREXO, Zentrix, or custom projects from the resume)",
                "description": "A 1-sentence description of the project and what it does",
                "skills": ["Skill 1", "Skill 2", ...],
                "technologies": ["Technology/tool used 1", "Technology/tool used 2", ...]
            }},
            ...
        ],
        "roles": [
            {{
                "name": "Role Name (e.g. AI Engineer, Full Stack Developer, Data Analyst)",
                "skills": ["Skill/Technology used in this role 1", "Skill/Technology used in this role 2", ...]
            }},
            ...
        ],
        "certifications_map": [
            {{
                "name": "Certification Name",
                "skills": ["Skill/Technology validated by this certification 1", "Skill/Technology validated by this certification 2", ...]
            }},
            ...
        ],
        "certifications": ["Certification 1", "Certification 2", ...],
        "education": [
            {{
                "school": "University/School Name",
                "degree": "Degree (e.g. B.S., M.S.)",
                "field_of_study": "Field of Study",
                "duration": "Duration (e.g., 2018 - 2022)"
            }},
            ...
        ],
        "experience": [
            {{
                "role": "Job Title/Role",
                "company": "Company Name",
                "duration": "Duration (e.g., 2022 - Present or 2021-2023)"
            }},
            ...
        ]
    }}

    Instructions:
    1. Extract all projects, skills, certifications, and roles from the resume.
    2. Map skills/technologies directly to the projects that use them.
    3. Map skills/technologies directly to the roles (e.g., AI Engineer, ML Engineer, Data Analyst) that require them.
    4. Map skills/technologies directly to the certifications that validate them.
    5. Ensure all skills/technologies belong to at least one project, role, or certification. Avoid generic placeholder projects like "Profile Highlights" or "Skills Index".

    Resume/Profile Text:
    {text}
    """

    response = generate_response(prompt)

    cleaned = response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
        
    match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1)

    try:
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Resume parsing failed: Invalid JSON returned by LLM. Cleaned response: {cleaned}") from e


def build_graph(profile_text, user_id="default"):

    data = extract_entities(profile_text)

    kg = KnowledgeGraph()

    # Clear previous user graph nodes before rebuilding
    kg.clear_graph(user_id)

    # 1. Store projects, their details and relationships to skills
    for project in data.get("projects", []):
        project_name = project.get("name")
        if not project_name:
            continue
        project_desc = project.get("description", "Project linked to your digital twin.")
        kg.create_project(project_name, project_desc, user_id)
        
        # Connect skills
        for skill in project.get("skills", []):
            kg.create_project_skill_relation(project_name, skill, user_id)
            
        # Connect technologies (also categorized as Skill nodes)
        for tech in project.get("technologies", []):
            kg.create_project_skill_relation(project_name, tech, user_id)

    # 2. Store roles and their relationship to skills
    for role_obj in data.get("roles", []):
        role_name = role_obj.get("name")
        if not role_name:
            continue
        for skill in role_obj.get("skills", []):
            kg.create_role_skill_relation(role_name, skill, user_id)

    # 3. Store certifications mapping to skills
    for cert_obj in data.get("certifications_map", []):
        cert_name = cert_obj.get("name")
        if not cert_name:
            continue
        for skill in cert_obj.get("skills", []):
            kg.create_certification_skill_relation(cert_name, skill, user_id)

    # 4. Store general certifications for dashboard stats backward compatibility
    for cert in data.get("certifications", []):
        kg.create_certification(cert, user_id)

    # 5. Store experience details for backward compatibility
    for exp in data.get("experience", []):
        kg.create_experience(
            exp.get("role", "Developer"),
            exp.get("company", "Company"),
            exp.get("duration", "N/A"),
            user_id
        )

    # 6. Store education
    for edu in data.get("education", []):
        kg.create_education(
            edu.get("school", "University"),
            edu.get("degree", "Degree"),
            edu.get("field_of_study", "Field of Study"),
            edu.get("duration", "N/A"),
            user_id
        )

    kg.close()

    return data