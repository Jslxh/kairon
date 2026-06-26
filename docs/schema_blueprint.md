# KAIRON Database Schema Blueprint

This document details the production-ready database configurations designed to scale the KAIRON Career Operating System. The backend utilizes a hybrid data layer architecture combining relational data (PostgreSQL), graph structures (Neo4j), and high-dimensional vectors (Qdrant).

---

## 1. Relational Database Schema (PostgreSQL)

This schema structures candidate auth sessions, profiles, workspace tasks, smart notes, and calendar schedules.

```sql
-- 1. Users table (Authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    target_role VARCHAR(100),
    bio TEXT,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    profile_pic_url TEXT,
    resume_name VARCHAR(255),
    resume_size VARCHAR(50),
    skills VARCHAR(100)[] DEFAULT '{}'::VARCHAR(100)[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Untitled Note',
    content TEXT,
    category VARCHAR(50) CHECK (category IN ('Interview Notes', 'Learning Notes', 'Career Notes', 'Project Notes', 'Personal Notes')),
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) CHECK (status IN ('Todo', 'In Progress', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Calendar Events table
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(30) CHECK (event_type IN ('Interview', 'Learning Session', 'Exam', 'Project Deadline', 'Certification', 'Meeting')),
    all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Career Roadmaps table (AI Planner outputs)
CREATE TABLE career_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    phases JSONB NOT NULL, -- Nested phases milestones
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Graph Database Schema (Neo4j)

Used for mapping relationships between candidate skills, workspace projects, courses, and certifications.

### Node Categories
- `(:Skill {id: "Python", type: "Skill"})`
- `(:Project {id: "ZORO", description: "email task orchestrator", type: "Project"})`
- `(:Certification {id: "AWS Certified Developer", issuer: "Amazon"})`
- `(:Role {id: "AI Engineer", baseline_readiness: 75})`

### Relationship Links
- `(:Skill)-[:USED_IN]->(:Project)`
- `(:Skill)-[:REQUIRED_FOR]->(:Role)`
- `(:Project)-[:BUILDS_COMPETENCY]->(:Skill)`
- `(:Certification)-[:VALIDATES]->(:Skill)`

---

## 3. Vector Database Collections (Qdrant)

Used for semantic search, vector indexing of candidate resume documents, and mapping similarity margins.

### Collection: `resume_vectors`
- **Vector Size**: 1536 dimensions (e.g. OpenAI `text-embedding-3-small`) or 384 dimensions (e.g. HuggingFace `all-MiniLM-L6-v2`).
- **Distance Metric**: Cosine Similarity.
- **Payload Schema**:
  ```json
  {
    "user_id": "UUID-string",
    "chunk_id": "integer",
    "content": "Text segment extracted from PDF resume page.",
    "section": "Skills / Experience / Academics"
  }
  ```

---

## 4. Document Store (MongoDB / JSONB)

Used for caching AI Chat history logs.

### Collection: `chat_history`
```json
{
  "_id": "ObjectId",
  "user_id": "UUID-string",
  "session_id": "string",
  "title": "Which projects use Python?",
  "messages": [
    {
      "sender": "user",
      "text": "Which projects use Python?",
      "timestamp": "ISO-Date"
    },
    {
      "sender": "bot",
      "text": "I queried the Knowledge Graph and found these matching nodes: ZORO, ACADRAG...",
      "source": "neo4j",
      "answerNodes": ["ZORO", "ACADRAG", "Zentrix AI"],
      "timestamp": "ISO-Date"
    }
  ],
  "updated_at": "ISO-Date"
}
```
