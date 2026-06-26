from llm import generate_response

def analyze_skill_gap(user_profile, target_role):
    prompt = f"""
Compare the candidate's actual profile details with the target role to identify matching skills, missing skills, readiness score, and a 90-day learning roadmap.

Candidate Profile Summary:
{user_profile}

Target Role:
{target_role}

Requirements:
1. matching_skills: List only the candidate's existing skills that are relevant to or match the target role. Do NOT list skills they do not have.
2. missing_skills: List skills, technologies, or competencies required for the target role that are missing from the candidate's profile.
3. readiness_score: An integer from 15 to 95 representing how ready the candidate is for this role.
4. reasoning: A brief 2-3 sentence overview of the skill gap analysis.
5. roadmap: A 3-month timeline (Month 1, Month 2, Month 3) containing focus areas and specific tasks to bridge the gap.

You MUST return ONLY a valid JSON object matching the format below. Do not include markdown wraps (like ```json), commentary, or extra text.

JSON Structure:
{{
  "matching_skills": ["skillA", "skillB"],
  "missing_skills": ["skillC", "skillD"],
  "readiness_score": 75,
  "reasoning": "A concise summary of matching and missing skills...",
  "roadmap": [
    {{
      "month": "Month 1",
      "focus": "Core Foundations...",
      "tasks": ["Study concept X", "Build project Y"]
    }},
    {{
      "month": "Month 2",
      "focus": "Advanced Integration...",
      "tasks": ["Implement skill Z", "Optimize pipeline W"]
    }},
    {{
      "month": "Month 3",
      "focus": "Validation...",
      "tasks": ["Deploy application V", "Perform validation test U"]
    }}
  ]
}}
"""
    return generate_response(prompt)