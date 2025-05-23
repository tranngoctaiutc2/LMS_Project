from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import create_google_doc, extract_text_from_google_doc

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY

def generate_advisor_content(topic, professor_content, study_duration, language="en"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    lang_note = "Please write the entire content in Vietnamese." if language == "vi" else "Please write the entire content in English."

    prompt = f"""
You are an Academic Advisor Agent. Your task is to create a complete, clear, and detailed learning roadmap for the topic: "{topic}".

Your objective is to help a learner progress from beginner to expert in this topic by providing a structured study path. The roadmap will be integrated into an interactive research notebook and must be well-formatted and practical.

Please use the following knowledge base to build the roadmap:

--- BEGIN KNOWLEDGE BASE ---
{professor_content}
--- END KNOWLEDGE BASE ---

If the user has a time constraint, use the following total study duration as a guide: {study_duration}

Follow the structure and style guidelines below strictly:

---

🧭 **1. Structure**

Organize the roadmap using the following format with markdown headers:

- ## Overview  
  A short introduction explaining the importance of having a structured roadmap for this topic.

- ## Learning Objectives  
  Bullet points outlining what a learner should be able to understand or achieve after completing this roadmap.

- ## Roadmap Structure  
  Break the topic into logical phases or subtopics. For each phase, include:
  - **Title of the phase**
  - **Description** of what will be learned
  - **Estimated time commitment** (e.g. 2 weeks, 10 hours)
  - **Prerequisites** (if any)
  - Markdown format (use `###` for each phase title)

- ## Suggested Learning Schedule  
  Distribute the phases over the given study duration (or propose your own if none provided).

- ## Summary  
  A brief recap of how the learner will progress and the final goal.

---

📝 **2. Style & Format**

- Use **markdown** formatting:
  - `##` for main sections, `###` for each phase/subtopic
  - `-` for bullet points
  - `**bold**` for key elements (time, prerequisites, etc.)

- Use clear, motivating, instructional language  
- Be logically ordered and easy to follow  
- Avoid fluff; every section must deliver value

---

🌐 **3. Language**

{lang_note}

---

🔗 **4. Integration**

This roadmap will be exported to a Google Doc and embedded in a digital learning system. Ensure formatting and structure are clean and professional.

Follow the section headers exactly as given. Do not add extra sections. Do not skip any section.
    """
    response = model.generate_content(prompt)
    return response.text


class AcademicAdvisorAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            topic = request.data.get("topic")
            user_id = request.data.get("user_id")
            study_duration = request.data.get("study_duration", "")
            professor_input = request.data.get("professor_content", "")
            language = request.data.get("language", "en")

            if not topic or not user_id or not professor_input:
                return Response(
                    {"error": "Missing required fields: topic, user_id, or professor_content"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES
            )

            if isinstance(professor_input, dict) and "doc_url" in professor_input:
                doc_url = professor_input["doc_url"]
                topic = topic or professor_input.get("topic", "")
                professor_content = extract_text_from_google_doc(doc_url, creds)
            elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com/document/"):
                professor_content = extract_text_from_google_doc(professor_input, creds)
            elif isinstance(professor_input, str):
                professor_content = professor_input
            else:
                return Response({"error": "Invalid professor_content format."}, status=400)

            content = generate_advisor_content(topic, professor_content, study_duration, language)
            doc_url = create_google_doc(f"🗺️ Learning Roadmap - {topic}", content, creds, user.email)

            api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="advisor"
            )

            return Response({
                "message": "Document created successfully.",
                "doc_url": doc_url
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print("❌ Error in AcademicAdvisorAgentAPIView:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
