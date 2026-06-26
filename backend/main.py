import os
import shutil
import logging
from fastapi import FastAPI, Header, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from career_assistant import CareerAssistant
from skill_gap import analyze_skill_gap
from interview_intelligence import generate_interview_questions
from graph_query import GraphQuery

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kairon_backend")

app = FastAPI(
    title="Kairon AI",
    version="1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant = CareerAssistant()
graph_query = GraphQuery()


class ChatRequest(BaseModel):
    question: str


class SkillGapRequest(BaseModel):
    profile: str
    target_role: str


class InterviewRequest(BaseModel):
    profile: str


class SyncProfileRequest(BaseModel):
    skills: list[str]
    projects: list[str]


class RoadmapRequest(BaseModel):
    role: str
    days: int


@app.get("/")
def home():
    try:
        return {
            "message": "CareerTwin AI API Running"
        }
    except Exception as e:
        logger.exception(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(request: ChatRequest, x_user_id: str = Header("default")):
    try:
        result = assistant.ask(
            request.question,
            x_user_id
        )
        return result
    except Exception as e:
        logger.exception(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/skill-gap")
def skill_gap(
    request: SkillGapRequest,
    x_user_id: str = Header("default")
):
    import json
    import re
    import traceback

    print(f"--- [BACKEND] /skill-gap Request ---")
    print(f"User ID: {x_user_id}")
    print(f"Target Role: {request.target_role}")

    try:
        # ── 1. Load resume data from Neo4j with safe defaults ─────────────────
        skills: list = []
        projects: list = []
        certifications: list = []
        experiences: list = []

        try:
            skills = graph_query.get_all_skills(x_user_id) or []
        except Exception as err:
            print("Skills query failed:", str(err))

        try:
            projects = graph_query.get_projects_details(x_user_id) or []
        except Exception as err:
            print("Projects query failed:", str(err))

        try:
            certifications = graph_query.get_all_certifications(x_user_id) or []
        except Exception as err:
            print("Certifications query failed:", str(err))

        try:
            experiences = graph_query.get_all_experiences(x_user_id) or []
        except Exception as err:
            print("Experiences query failed:", str(err))

        print(f"[DIAG] Neo4j query for user_id='{x_user_id}'")
        print(f"[DIAG] Skills found in Neo4j: {len(skills)} -> {skills}")
        print(f"[DIAG] Projects found in Neo4j: {len(projects)} -> {[p.get('name') for p in projects]}")
        print(f"[DIAG] Certifications found: {len(certifications)}")
        print(f"[DIAG] Experiences found: {len(experiences)}")

        # ── 2. Fallback: parse ALL fields from profile string when Neo4j is empty ─
        # This handles: resume uploaded but graph not yet indexed into Neo4j,
        # or Neo4j offline, or new user with data only in localStorage.
        profile_str = request.profile.strip() if request.profile else ""
        has_neo4j_data = bool(skills or projects or certifications or experiences)

        # Parse the full profile string into structured fields for fallback use
        fb_name = ""
        fb_target_role = ""
        fb_bio = ""
        fb_skills: list = []
        fb_resume_name = ""

        if profile_str:
            print(f"[DIAG] Parsing profile string for fallback fields.")
            print(f"[DIAG] profile string received:\n{repr(profile_str)}")
            for line in profile_str.split("\n"):
                stripped = line.strip()
                lower = stripped.lower()
                if lower.startswith("candidate name:"):
                    fb_name = stripped.split(":", 1)[1].strip()
                elif lower.startswith("target role:"):
                    fb_target_role = stripped.split(":", 1)[1].strip()
                elif lower.startswith("professional bio:"):
                    fb_bio = stripped.split(":", 1)[1].strip()
                elif lower.startswith("skills profile:"):
                    skills_raw = stripped.split(":", 1)[1].strip()
                    fb_skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
                elif lower.startswith("active resume:"):
                    fb_resume_name = stripped.split(":", 1)[1].strip()

            print(f"[DIAG] Fallback parsed - name={fb_name!r}, role={fb_target_role!r}, "
                  f"skills={fb_skills}, resume={fb_resume_name!r}")

        # Determine if we have usable data from any source
        has_profile_string_data = bool(fb_skills or fb_bio or (fb_resume_name and fb_resume_name.lower() != "none"))
        has_data = has_neo4j_data or has_profile_string_data

        if not has_data:
            print(f"[DIAG] 400 TRIGGERED - No resume data in Neo4j for user_id='{x_user_id}' "
                  f"and no usable data in profile string (no skills, no bio, no resume name).")
            return JSONResponse(
                status_code=400,
                content={"error": "Resume not uploaded. Please upload and analyze a resume first."}
            )

        # When Neo4j is empty, use fallback profile string fields
        if not has_neo4j_data and fb_skills:
            skills = fb_skills
            print(f"[DIAG] Using fallback skills from profile string: {skills}")

        # ── 3. Build profile summary for LLM ──────────────────────────────────
        # If Neo4j has data, build from graph. If not, build from profile string.
        project_lines = []
        for p in projects:
            if not isinstance(p, dict):
                continue
            p_name = p.get("name", "")
            p_desc = p.get("description", "")
            p_skills = p.get("skills", [])
            if p_name:
                line = f"  - {p_name}"
                if p_desc:
                    line += f": {p_desc}"
                if p_skills:
                    line += f" (Skills: {', '.join(p_skills)})"
                project_lines.append(line)

        if has_neo4j_data:
            # Build from graph data
            profile_summary = "CANDIDATE PROFILE:\n"
            if skills:
                profile_summary += f"Skills: {', '.join(skills)}\n"
            if project_lines:
                profile_summary += f"Projects:\n{'  '.join(project_lines)}\n"
            if certifications:
                profile_summary += f"Certifications: {', '.join(certifications)}\n"
            if experiences:
                exp_strs = [
                    f"{e.get('role', '')} at {e.get('company', '')} ({e.get('duration', '')})"
                    for e in experiences if isinstance(e, dict)
                ]
                profile_summary += f"Experience: {', '.join(exp_strs)}\n"
        else:
            # Build from profile string fields (Neo4j not yet indexed)
            print(f"[DIAG] Neo4j empty - building LLM summary from profile string fallback fields.")
            profile_summary = "CANDIDATE PROFILE:\n"
            if fb_name:
                profile_summary += f"Name: {fb_name}\n"
            if fb_bio:
                profile_summary += f"Background: {fb_bio}\n"
            if fb_skills:
                profile_summary += f"Skills: {', '.join(fb_skills)}\n"
            elif fb_resume_name and fb_resume_name.lower() != "none":
                # Resume name is present but skills not extracted yet
                profile_summary += f"Resume: {fb_resume_name}\n"
                profile_summary += "Note: Resume data is being processed. Using available profile information.\n"

        print(f"Profile Summary built: {len(profile_summary)} chars")
        print(f"[DIAG] Profile summary sent to LLM:\n{profile_summary}")

        # ── 4. Call LLM ───────────────────────────────────────────────────────
        try:
            raw = analyze_skill_gap(profile_summary, request.target_role)
        except Exception as llm_err:
            print("LLM call failed:", str(llm_err))
            print(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={"error": f"LLM generation failed: {str(llm_err)}"}
            )

        print(f"LLM Raw Output:\n{raw}")

        # ── 5. Parse JSON response ────────────────────────────────────────────
        try:
            cleaned = raw.strip()
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

            parsed = json.loads(cleaned)
        except Exception as parse_err:
            print("JSON parse failed:", str(parse_err))
            print("Raw LLM response was:", raw)
            return JSONResponse(
                status_code=500,
                content={"error": f"Could not parse skill gap response: {str(parse_err)}"}
            )

        # ── 6. Validate required fields ───────────────────────────────────────
        matching = parsed.get("matching_skills", [])
        missing = parsed.get("missing_skills", [])
        score = parsed.get("readiness_score", 0)
        roadmap = parsed.get("roadmap", [])

        if not isinstance(matching, list):
            matching = []
        if not isinstance(missing, list):
            missing = []
        if not isinstance(score, (int, float)):
            score = 0
        if not isinstance(roadmap, list):
            roadmap = []

        print(f"Skill gap parsed: matching={len(matching)}, missing={len(missing)}, score={score}")

        return {
            "role": request.target_role,
            "readiness_score": score,
            "matching_skills": matching,
            "missing_skills": missing,
            "reasoning": parsed.get("reasoning", ""),
            "roadmap": roadmap
        }

    except Exception as e:
        print("Skill Gap Error:", str(e))
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


def _normalize_question(q: dict) -> dict:
    """
    Normalize a single question dict to always use the 'guidance' key
    and validate required fields exist.
    """
    if not isinstance(q, dict):
        return None
    if not q.get("question") or not q.get("category"):
        return None

    # Normalize category label
    category = q.get("category", "")
    if category not in ["Project Based", "Technical", "Behavioral", "Resume Deep Dive"]:
        if "project" in category.lower():
            q["category"] = "Project Based"
        elif "technical" in category.lower():
            q["category"] = "Technical"
        elif "behavioral" in category.lower() or "hr" in category.lower():
            q["category"] = "Behavioral"
        else:
            q["category"] = "Resume Deep Dive"

    # Normalize guidance key: accept guidance, preparation_notes, or preparationNotes
    if not q.get("guidance"):
        q["guidance"] = q.get("preparation_notes") or q.get("preparationNotes") or ""
    # Remove legacy keys to keep response clean
    q.pop("preparation_notes", None)
    q.pop("preparationNotes", None)

    return q


@app.post("/interview")
def interview(
    request: InterviewRequest,
    x_user_id: str = Header("default")
):
    import json
    import re
    import traceback

    print(f"--- [BACKEND] /interview Request ---")
    print(f"User ID: {x_user_id}")

    try:
        skills = []
        projects = []
        certifications = []
        experiences = []
        educations = []

        # ── 1. Load resume data from Neo4j graph ──────────────────────────────
        try:
            skills = graph_query.get_all_skills(x_user_id) or []
            projects = graph_query.get_projects_details(x_user_id) or []
            certifications = graph_query.get_all_certifications(x_user_id) or []
            experiences = graph_query.get_all_experiences(x_user_id) or []
            try:
                educations = graph_query.get_all_education(x_user_id) or []
            except Exception as edu_err:
                print("Education query failed:", str(edu_err))
                educations = []
        except Exception as db_err:
            print("Interview database query failed:", str(db_err))

        print("Resume loaded")

        # ── 2. Parse profile string as secondary fallback source ──────────────
        if not skills and request.profile:
            for line in request.profile.split("\n"):
                if "Skills Profile:" in line:
                    skills_str = line.split("Skills Profile:", 1)[1].strip()
                    if skills_str:
                        skills = [s.strip() for s in skills_str.split(",") if s.strip()]

        print("Resume parsed")
        print("Skills found:", len(skills))
        print("Projects found:", len(projects))

        # ── 3. Guard: require at least some resume data ───────────────────────
        has_profile = bool(skills or projects or certifications or experiences or educations)
        if not has_profile:
            return JSONResponse(
                status_code=400,
                content={"error": "Resume not uploaded. Please upload and analyze a resume first."}
            )

        # ── 4. Build rich project-centric profile summary for LLM prompt ─────
        # Fetch full project details including per-project skills from Neo4j
        projects_detailed = []
        try:
            projects_detailed = graph_query.get_projects_details(x_user_id) or []
        except Exception:
            projects_detailed = []

        project_lines = []
        for p in projects_detailed:
            p_name = p.get('name', '') if isinstance(p, dict) else str(p)
            p_desc = p.get('description', '') if isinstance(p, dict) else ''
            if p_name and p_name.strip().lower() != 'profile highlights':
                line = f"  - {p_name}"
                if p_desc:
                    line += f": {p_desc}"
                project_lines.append(line)

        profile_summary = "CANDIDATE PROFILE:\n"
        profile_summary += f"Skills: {', '.join(skills)}\n" if skills else ""
        profile_summary += f"Projects:\n{'\n'.join(project_lines)}\n" if project_lines else ""
        profile_summary += f"Certifications: {', '.join(certifications)}\n" if certifications else ""
        if experiences:
            exp_strs = [f"{e.get('role','')} at {e.get('company','')} ({e.get('duration','')})"
                        for e in experiences if isinstance(e, dict)]
            profile_summary += f"Experience: {', '.join(exp_strs)}\n"
        if educations:
            edu_strs = [f"{ed.get('degree','')} in {ed.get('field_of_study','')} at {ed.get('school','')}"
                        for ed in educations if isinstance(ed, dict)]
            profile_summary += f"Education: {', '.join(edu_strs)}\n"

        # ── 5. Call LLM ───────────────────────────────────────────────────────
        print("Calling LLM")
        try:
            raw = generate_interview_questions(profile_summary)
        except Exception as llm_err:
            print("LLM call failed:", str(llm_err))
            print(traceback.format_exc())
            return {"questions": [], "message": "LLM question generation failed. Please try again."}

        print("LLM Response received")

        # ── 6. Parse LLM JSON response ────────────────────────────────────────
        try:
            cleaned = raw.strip()
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

            parsed = json.loads(cleaned)
        except Exception as parse_err:
            print("LLM response JSON parse failed:", str(parse_err))
            print("Raw LLM response was:", raw)
            return {"questions": [], "message": "Could not parse question response from LLM."}

        # ── 7. Parse: handle both flat {"questions":[...]} and nested format ──
        #
        # Some LLM models return a nested dict:
        # { "project_questions": [...], "technical_questions": [...],
        #   "behavioral_questions": [...], "resume_deep_dive_questions": [...] }
        # Others return the expected flat: { "questions": [...] }
        # We handle both.
        raw_questions: list = []

        if isinstance(parsed, dict):
            if isinstance(parsed.get("questions"), list):
                # Flat format — preferred
                raw_questions = parsed["questions"]
            else:
                # Nested format — flatten and assign categories
                category_map = {
                    "project_questions": "Project Based",
                    "technical_questions": "Technical",
                    "behavioral_questions": "Behavioral",
                    "resume_deep_dive_questions": "Resume Deep Dive",
                    "resume_deep_dive": "Resume Deep Dive",
                    "deep_dive_questions": "Resume Deep Dive",
                }
                for key, category_label in category_map.items():
                    bucket = parsed.get(key, [])
                    if isinstance(bucket, list):
                        for item in bucket:
                            if isinstance(item, dict) and item.get("question"):
                                item["category"] = category_label
                                raw_questions.append(item)

        valid_questions = []
        for q in raw_questions:
            normalized = _normalize_question(q)
            if normalized is not None:
                valid_questions.append(normalized)

        print("Questions generated:", len(valid_questions))

        if not valid_questions:
            return {"questions": [], "message": "No interview questions could be generated from the current resume."}

        return {"questions": valid_questions}

    except Exception as e:
        print("Interview Generation Error:", str(e))
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/graph")
def get_graph(x_user_id: str = Header("default")):
    try:
        try:
            return graph_query.get_graph_data(x_user_id)
        except Exception as db_err:
            print("Graph database query failed, returning empty graph:", str(db_err))
            return {
                "nodes": [],
                "links": []
            }
    except Exception as e:
        logger.exception(str(e))
        return {
            "nodes": [],
            "links": []
        }


@app.get("/dashboard")
def get_dashboard(x_user_id: str = Header("default")):
    try:
        from llm import generate_response
        
        # Safe default placeholders
        skills = []
        projects = []
        certifications = []
        experiences = []
        projects_details = []
        
        db_available = True
        try:
            skills = graph_query.get_all_skills(x_user_id) or []
            projects = graph_query.get_all_projects(x_user_id) or []
            certifications = graph_query.get_all_certifications(x_user_id) or []
            experiences = graph_query.get_all_experiences(x_user_id) or []
            projects_details = graph_query.get_projects_details(x_user_id) or []
        except Exception as db_err:
            print("DASHBOARD DB ERROR (using default):", str(db_err))
            db_available = False
            
        skills_count = len(skills)
        projects_count = len(projects)
        certs_count = len(certifications)
        experience_count = len(experiences)
        
        # Check if the user profile / resume data is completely missing or empty, or DB is unavailable
        if not db_available or (skills_count == 0 and projects_count == 0 and certs_count == 0 and experience_count == 0):
            return {
                "resume_uploaded": False,
                "readiness_score": 0,
                "skills_indexed": 0,
                "projects_linked": 0,
                "certifications": 0,
                "roadmap_progress": 0,
                "total_skills": 0,
                "total_projects": 0,
                "total_certifications": 0,
                "skills": [],
                "projects": [],
                "projects_details": [],
                "insights": "Upload your resume to generate digital twin insights.",
                "progress": [
                    {"month": "Jan", "score": 0},
                    {"month": "Feb", "score": 0},
                    {"month": "Mar", "score": 0},
                    {"month": "Apr", "score": 0},
                    {"month": "May", "score": 0}
                ]
            }
            
        # Calculate simple dynamic readiness score based on candidate profile metrics
        readiness = min(95, max(15, skills_count * 4 + projects_count * 8 + certs_count * 5 + experience_count * 5))
        if readiness < 40 and (skills_count > 0 or projects_count > 0):
            readiness = 40
            
        # Generate insights dynamically using LLM
        insights = "Upload your resume to generate digital twin insights."
        if skills:
            try:
                prompt = f"Given a candidate with skills: {', '.join(skills)} and projects: {', '.join(projects)}. Write a concise, 1-2 sentence career co-pilot insight summarizing their primary growth areas to achieve their career goals. Focus only on their profile."
                insights = generate_response(prompt)
            except Exception as llm_err:
                print("LLM generation failed:", str(llm_err))

        return {
            "resume_uploaded": True,
            "readiness_score": readiness,
            "skills_indexed": skills_count,
            "projects_linked": projects_count,
            "certifications": certs_count,
            "roadmap_progress": 0,
            "total_skills": skills_count,
            "total_projects": projects_count,
            "total_certifications": certs_count,
            "skills": skills,
            "projects": projects,
            "projects_details": projects_details,
            "insights": insights,
            "progress": [
                {"month": "Jan", "score": max(15, readiness - 20)},
                {"month": "Feb", "score": max(20, readiness - 15)},
                {"month": "Mar", "score": max(25, readiness - 10)},
                {"month": "Apr", "score": max(30, readiness - 5)},
                {"month": "May", "score": readiness}
            ]
        }
    except Exception as e:
        print("DASHBOARD ERROR:", str(e))
        import traceback
        traceback.print_exc()
        raise


@app.post("/generate-roadmap")
def generate_roadmap(request: RoadmapRequest, x_user_id: str = Header("default")):
    import json
    import re
    from llm import generate_response

    print(f"--- [BACKEND] /generate-roadmap Request ---")
    print(f"User ID: {x_user_id}")
    print(f"Target Role: {request.role}")
    print(f"Duration: {request.days}")

    try:
        skills = graph_query.get_all_skills(x_user_id)
        projects = graph_query.get_all_projects(x_user_id)
        certifications = graph_query.get_all_certifications(x_user_id)
        experiences = graph_query.get_all_experiences(x_user_id)
        
        profile_summary = f"""
        Skills: {', '.join(skills) if skills else ''}
        Projects: {', '.join(projects) if projects else ''}
        Certifications: {', '.join(certifications) if certifications else ''}
        Experience: {', '.join([f"{e.get('role', '')} at {e.get('company', '')} ({e.get('duration', '')})" for e in experiences if e is not None]) if experiences else ''}
        """
        print(f"Query Profile Summary: {profile_summary}")
        
        prompt = f"""You are Kairon AI, a premium career digital twin planner.
Generate a structured learning roadmap for a user transitioning to a target role.

User's Profile:
{profile_summary}

Target Transition:
- Target Role: {request.role}
- Duration: {request.days} Days

Requirements:
1. Skip duplicate skills: Since the user already knows {", ".join(skills)}, do NOT include beginner courses or basics for these skills in the plan. Skip straight to advanced integration, MLOps, deployment, APIs, testing, or system design relevant to the target role.
2. Output format: You MUST return ONLY a valid JSON object matching the format below. Do not include markdown wraps (like ```json), commentary, or extra text.

JSON Structure:
{{
  "role": "{request.role}",
  "duration": "{request.days} Days",
  "phase_1": {{
    "title": "Phase 1: Foundations & Setup",
    "deliverables": ["Deliverable 1", "Deliverable 2"]
  }},
  "phase_2": {{
    "title": "Phase 2: Integration & Build",
    "deliverables": ["Deliverable 3", "Deliverable 4"]
  }},
  "phase_3": {{
    "title": "Phase 3: Validation & Deploy",
    "deliverables": ["Deliverable 5", "Deliverable 6"]
  }},
  "resources": [
    {{
      "title": "Advanced study material title...",
      "provider": "Coursera|Udemy|GitHub",
      "level": "Intermediate|Advanced"
    }}
  ]
}}
"""
        response_text = generate_response(prompt)
        print(f"LLM Raw Output:\n{response_text}")
        
        cleaned = response_text.strip()
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
            
        parsed = json.loads(cleaned)
        print(f"Successfully Parsed JSON:\n{parsed}")
        return parsed
    except Exception as e:
        logger.exception(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sync-profile")
def sync_profile(request: SyncProfileRequest, x_user_id: str = Header("default")):
    try:
        from knowledge_graph import KnowledgeGraph
        kg = KnowledgeGraph()
        kg.clear_graph(x_user_id)

        if request.projects:
            # Link each skill to the first project as a representative anchor.
            # Full project↔skill mapping is built by /upload-resume via graph_builder.
            for skill in request.skills:
                kg.create_skill_project_relation(skill, request.projects[0], x_user_id)
        else:
            # No projects available — create standalone Skill nodes without any
            # central placeholder hub (never use "Profile Highlights").
            with kg.driver.session() as session:
                for skill in request.skills:
                    session.run(
                        "MERGE (s:Skill {name: $skill, user_id: $user_id})",
                        skill=skill,
                        user_id=x_user_id
                    )

        kg.close()
        return {"status": "success"}
    except Exception as e:
        logger.exception(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), x_user_id: str = Header("default")):
    try:
        from pdf_loader import load_pdf
        from chunker import create_chunks
        from embeddings import generate_embeddings
        from vector_store import store_vectors
        from graph_builder import build_graph

        # Write file to temporary path for pdf extraction
        temp_path = f"temp_{x_user_id.replace('@', '_').replace('.', '_')}.pdf"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            text = load_pdf(temp_path)
            chunks = create_chunks(text)
            vectors = generate_embeddings(chunks)
            
            # Store embeddings in Qdrant scoped by user
            store_vectors(chunks, vectors, x_user_id)
            
            # Parse entities and rebuild Neo4j Graph scoped by user
            extracted = build_graph(text, x_user_id)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        return {"status": "success", "extracted_data": extracted}
    except Exception as e:
        logger.exception(str(e))
        raise HTTPException(status_code=500, detail=str(e))