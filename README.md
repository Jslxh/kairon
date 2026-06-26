# Kairon - AI-Powered Career Digital Twin

Kairon is an intelligent career co-pilot platform that combines resume processing, knowledge graph construction, and AI-powered tools to help users understand their professional profile, identify skill gaps, prepare for interviews, and plan their career transitions.

## Features

- **Resume Processing**: Upload and parse PDF resumes to extract skills, projects, certifications, and experience
- **AI-Powered Career Assistant**: Get contextual answers about your profile and career goals
- **Knowledge Graph**: Visualize your professional profile as an interactive Neo4j-backed skill and project graph
- **Skill Gap Analysis**: Compare your current skills against a target role and receive a readiness score with a learning roadmap
- **Interview Intelligence**: Generate personalized interview questions based on your resume and target role
- **Learning Roadmap Generator**: Create a structured, phase-by-phase career transition plan
- **Dashboard Analytics**: View real-time profile metrics, readiness score, and career insights
- **Study Tools**: Built-in Notes, Tasks, and Calendar pages for organized learning
- **Secure Authentication**: User registration, login, and profile management

## Architecture

Kairon follows a modern full-stack architecture:

### Backend (Python/FastAPI)
- **Framework**: FastAPI for high-performance, async API endpoints
- **Vector Store**: Qdrant for efficient semantic similarity search and resume retrieval
- **Knowledge Graph**: Neo4j for structured skill and project relationship modeling
- **AI/ML**: Sentence Transformers (`BAAI/bge-small-en-v1.5`) for embeddings and LangChain for LLM orchestration
- **LLM**: OpenRouter API (default model: `nvidia/nemotron-3-super-120b-a12b:free`)
- **File Processing**: PyPDF for PDF resume parsing
- **Configuration**: python-dotenv for environment management

### Frontend (React/Vite)
- **Framework**: React 19 with Vite and TypeScript
- **Styling**: Tailwind CSS v4 for responsive, modern UI
- **State Management**: React context and hooks
- **Routing**: React Router v7 for seamless navigation
- **Charts**: Recharts for data visualization and progress tracking
- **Animations**: Framer Motion for smooth transitions
- **Calendar**: FullCalendar for study scheduling
- **Markdown**: react-markdown for rendering AI responses

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+**
- **Node.js 18+**
- **Qdrant** (running locally or via Docker)
- **Neo4j** (running locally or via Neo4j Desktop/AuraDB)
- **Git**
- **OpenRouter API Key** (free tier available at openrouter.ai)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kairon
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file in the root directory (see Environment Variables section below)
```

Start Qdrant locally (Docker recommended):
```bash
docker run -p 6333:6333 qdrant/qdrant
```

Start Neo4j locally (or use Neo4j Desktop), then start the backend:
```bash
# From the root directory
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## API Endpoints

### Core
- `GET /` - Health check

### Resume & Profile
- `POST /upload-resume` - Upload and process a PDF resume (extracts entities into Qdrant + Neo4j)
- `POST /sync-profile` - Sync manually entered skills and projects to the knowledge graph

### Career Assistant
- `POST /chat` - Ask career-related questions with RAG-based context retrieval

### Dashboard
- `GET /dashboard` - Get profile metrics, readiness score, and AI-generated career insights

### Skill Gap Analysis
- `POST /skill-gap` - Analyse skill gaps against a target role and generate a learning roadmap

### Interview Preparation
- `POST /interview` - Generate personalised interview questions from the user's resume and profile

### Learning Roadmap
- `POST /generate-roadmap` - Generate a structured, phased career transition roadmap

### Knowledge Graph
- `GET /graph` - Retrieve the user's skill and project relationship graph for visualisation

## Technology Stack

### Backend
- **FastAPI** - Modern, async Python web framework
- **Qdrant** - Vector database for semantic similarity search
- **Neo4j** - Graph database for skill and project relationships
- **LangChain** - LLM application orchestration framework
- **langchain-qdrant** - Qdrant integration for LangChain
- **Sentence Transformers** - Local text embedding generation
- **PyPDF** - PDF parsing and text extraction
- **Google Generative AI SDK** - Optional Gemini integration
- **Pydantic** - Data validation and settings management
- **python-dotenv** - Environment variable management

### Frontend
- **React 19** - UI library
- **TypeScript** - Typed JavaScript
- **Vite** - Build tool and development server
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Router v7** - Declarative client-side routing
- **Recharts** - Composable charting library
- **Framer Motion** - Production-ready animation library
- **FullCalendar** - Interactive scheduling and calendar UI
- **Axios** - HTTP client for API communication
- **Lucide React** - Icon library
- **react-markdown** - Markdown rendering for AI responses

## Project Structure

```
kairon/
├── backend/                        # Python/FastAPI backend
│   ├── main.py                    # FastAPI application entry point and all API routes
│   ├── career_assistant.py        # RAG-based career Q&A assistant
│   ├── skill_gap.py               # Skill gap analysis logic
│   ├── interview_intelligence.py  # Interview question generation
│   ├── graph_builder.py           # Neo4j knowledge graph construction from resume
│   ├── graph_query.py             # Neo4j graph query helpers
│   ├── knowledge_graph.py         # Neo4j driver and graph management
│   ├── rag_engine.py              # Retrieval-Augmented Generation pipeline
│   ├── vector_store.py            # Qdrant vector storage operations
│   ├── embeddings.py              # Sentence transformer embedding generation
│   ├── chunker.py                 # Document chunking for vector indexing
│   ├── pdf_loader.py              # PDF text extraction
│   ├── ingest.py                  # Document ingestion orchestration
│   ├── llm.py                     # LLM client (OpenRouter) abstraction
│   ├── prompts.py                 # LLM prompt templates
│   ├── jd_loader.py               # Job description loader
│   ├── config.py                  # Environment-based configuration
│   └── qdrant_db/                 # Local Qdrant persistence (auto-generated)
├── frontend/                      # React/Vite/TypeScript frontend
│   ├── src/
│   │   ├── components/            # Reusable UI components (Sidebar, etc.)
│   │   ├── context/               # React context providers
│   │   ├── pages/                 # Page-level components
│   │   │   ├── Dashboard.tsx      # Profile metrics and career insights
│   │   │   ├── Assistant.tsx      # AI career chat interface
│   │   │   ├── SkillGap.tsx       # Skill gap analysis and roadmap
│   │   │   ├── Interview.tsx      # Interview question generator
│   │   │   ├── Graph.tsx          # Interactive knowledge graph visualisation
│   │   │   ├── Roadmap.tsx        # Career transition roadmap
│   │   │   ├── Notes.tsx          # Study notes
│   │   │   ├── Tasks.tsx          # Task management
│   │   │   ├── Calendar.tsx       # Study calendar
│   │   │   ├── Settings.tsx       # User profile and settings
│   │   │   ├── Login.tsx          # Authentication
│   │   │   ├── Register.tsx       # User registration
│   │   │   └── ForgotPassword.tsx # Password recovery
│   │   ├── services/              # API service layer
│   │   ├── App.tsx                # Application root and routing
│   │   └── main.tsx               # Vite entry point
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite configuration
│   └── tsconfig.json              # TypeScript configuration
├── data/                          # User data storage
├── docs/                          # Project documentation
├── requirements.txt               # Python dependencies
└── .env                           # Environment variables (not committed)
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# LLM Configuration
OPENROUTER_API_KEY=your-openrouter-api-key
MODEL_NAME=nvidia/nemotron-3-super-120b-a12b:free

# Embedding Model
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# Qdrant Vector Store
QDRANT_COLLECTION=career_twin

# Neo4j Knowledge Graph
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
```

## AI Models

Kairon uses the following AI models by default:

- **Embedding Model**: `BAAI/bge-small-en-v1.5` (sentence-transformers) for resume and query embeddings
- **LLM**: `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter (configurable — any OpenRouter-supported model can be substituted)

## Troubleshooting

### Common Issues

1. **Qdrant Connection Failed**
   - Ensure Qdrant is running: `docker run -p 6333:6333 qdrant/qdrant`
   - Verify the collection name in `.env` matches `QDRANT_COLLECTION`

2. **Neo4j Connection Failed**
   - Ensure Neo4j is running and accessible at the configured `NEO4J_URI`
   - Verify `NEO4J_USER` and `NEO4J_PASSWORD` in `.env`
   - The graph endpoints return empty data gracefully when Neo4j is unavailable

3. **OpenRouter API Errors**
   - Verify `OPENROUTER_API_KEY` is set correctly in `.env`
   - Check your OpenRouter account for rate limits or credit balance
   - Try switching `MODEL_NAME` to another free model

4. **Resume Upload Failures**
   - Only PDF files are currently supported
   - Ensure the virtual environment is activated before starting the backend
   - Check the console output for extraction or graph-building errors

5. **Port Already in Use**
   - Backend: Change the port in the `uvicorn` command
   - Frontend: Vite will automatically try alternative ports (5174, 5175, etc.)

6. **Module Import Errors**
   - Ensure the virtual environment is activated
   - Re-run `pip install -r requirements.txt`
   - Confirm Python version is 3.10+

## Future Enhancements

Planned features for future releases:
- [ ] Multi-language resume support
- [ ] Job description upload and automatic JD-vs-resume matching
- [ ] Mock interview simulation with AI feedback
- [ ] LinkedIn profile import
- [ ] Collaborative career planning rooms
- [ ] Mobile application
- [ ] Advanced analytics and career trajectory predictions
- [ ] Export capabilities (PDF roadmap, skill report)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Thanks to all open-source projects used in this application
- Special thanks to the FastAPI, React, Neo4j, and Qdrant communities
- Inspired by the need for intelligent, personalised career guidance tools

---

**Kairon - Your AI-powered career digital twin**
