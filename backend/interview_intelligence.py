from llm import generate_response

def generate_interview_questions(profile):
    prompt = f"""
You are a senior technical interviewer. Generate mock interview questions strictly based on the candidate's actual profile details.
Do NOT use a generic question bank. Every question must originate from the candidate's skills, projects, certifications, and experience.

Candidate Profile Summary:
{profile}

Requirements:
Generate exactly 15 questions in total with the following categories and counts:
1. "Project Based": 5 questions focusing on the candidate's specific projects (ask about their specific architecture, tech stack, and implementation details).
2. "Technical": 5 technical questions about their specific skills, languages, tools, and certifications.
3. "Behavioral": 3 behavioral/HR questions based on their professional experience, teamwork, and background.
4. "Resume Deep Dive": 2 follow-up questions analyzing academic coursework, education, or deep details on their resume.

Do NOT include any project names, company names, tools, or skills that are not present in the Candidate Profile Summary.
Specifically, NEVER reference Zoro, Trexo, AcadRAG, Zentrix, or AI Engineer unless they are explicitly mentioned in the Candidate Profile Summary.

You MUST return ONLY a valid JSON object matching the format below. Do not include markdown wraps (like ```json), commentary, or extra text.

JSON Structure:
{{
  "questions": [
    {{
      "category": "Project Based",
      "question": "Specific question about a project from the candidate profile...",
      "guidance": "Preparation notes detailing what to emphasize..."
    }},
    {{
      "category": "Technical",
      "question": "Specific technical question about a skill or certification...",
      "guidance": "Technical points to cover..."
    }},
    {{
      "category": "Behavioral",
      "question": "Behavioral question based on experience...",
      "guidance": "How to structure response using STAR method..."
    }},
    {{
      "category": "Resume Deep Dive",
      "question": "Deep dive or follow-up question based on resume education/details...",
      "guidance": "Emphasis or direction for response..."
    }}
  ]
}}
"""
    return generate_response(prompt)