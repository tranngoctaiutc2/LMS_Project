from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import search_serpapi_links, create_google_doc, extract_text_from_google_doc
from google.oauth2 import service_account

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
SERPAPI_KEY = settings.SERPAPI_KEY

def generate_assistant_content(topic, references, professor_content="", language="en"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    references_text = "\n".join([f"- {title}: {url}" for title, url in references])
    lang_note = "Please write the entire content in Vietnamese." if language == "vi" else "Please write the entire content in English."

    prompt = f"""
You are a Teaching Assistant Agent. Your task is to create a comprehensive and structured set of practice materials for the topic: "{topic}".

Your objective is to support the learner’s mastery of the topic by providing exercises that align with the following knowledge base and increase in difficulty over time. These materials will be integrated into an interactive research notebook or study system.

--- BEGIN KNOWLEDGE BASE ---
{professor_content}
--- END KNOWLEDGE BASE ---

Follow the instructions below precisely:

---

📘 **1. Structure**

Use the following markdown-based format:

- ## Overview  
  A short explanation of how the practice material is structured and what types of exercises are included.

- ## Progressive Exercises  
  Break the exercises into levels: Beginner, Intermediate, and Advanced.  
  For each level, include:
  - A short title of the exercise
  - The actual exercise question or task
  - Real-world context if possible (e.g. "In a hospital...", "In a financial app...")
  - Use `### Beginner`, `### Intermediate`, etc.

- ## Quiz Questions  
  Include 5–10 multiple choice or short-answer questions.
  - Mark the correct answer clearly.
  - Include an explanation after each answer.

- ## Hands-on Projects  
  Provide 1–2 larger tasks or mini-projects that integrate multiple concepts.  
  Each should include:
  - Objective
  - Description
  - Expected output/result
  - Required tools/libraries (if any)

- ## Real-world Scenarios  
  Describe practical applications of the topic and include 1–2 challenge questions for each.

- ## Solutions & Explanations  
  Provide full, detailed answers and reasoning for all questions and exercises above.

---

🧠 **2. Style & Format**

- Use **markdown** formatting:
  - `##`, `###` for structure
  - `-` for bullets
  - `**bold**` to emphasize key concepts
- Number quiz and exercises clearly
- Use simple and motivating instructional language
- Align questions progressively with learner’s depth

---

🔍 **3. Discovery Guidelines**

Use the following references to inspire or source:
{references_text}
- Real-world examples
- Typical problems faced in industry
- Public datasets or coding repositories (if needed)

Avoid copying verbatim; always rewrite or summarize.

---

🌐 **4. Language**

{lang_note}

---

📄 **5. Integration Notes**

These materials will be embedded in a Google Doc and linked in an interactive learning platform. Ensure formatting is clean, consistent, and clearly structured.

Follow the section headers exactly as given. Do not add extra sections. Do not skip any section.
    """
    response = model.generate_content(prompt)
    return response.text

class TeachingAssistantAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Kiểm tra cấu hình
            if not all([hasattr(settings, attr) for attr in ['CREDENTIALS_FILE', 'GEMINI_API_KEY', 'SERPAPI_KEY']]):
                return Response({"error": "Missing API configuration"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            topic = request.data.get("topic")
            user_id = request.data.get("user_id")
            professor_input = request.data.get("professor_content", "")
            language = request.data.get("language", "en")

            # Kiểm tra đầu vào
            if not topic or not user_id or not professor_input:
                return Response(
                    {"error": "Missing required fields: topic, user_id, or professor_content"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Kiểm tra ngôn ngữ
            SUPPORTED_LANGUAGES = ["en", "vi"]
            if language not in SUPPORTED_LANGUAGES:
                return Response({"error": f"Language {language} not supported"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            # Xử lý professor_content
            if isinstance(professor_input, dict) and "doc_url" in professor_input:
                doc_url = professor_input["doc_url"]
                topic = topic or professor_input.get("topic", "")
                professor_content = extract_text_from_google_doc(doc_url, creds)
            elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com/document/"):
                professor_content = extract_text_from_google_doc(professor_input, creds)
            elif isinstance(professor_input, str):
                professor_content = professor_input
            else:
                return Response({"error": "Invalid professor_content format"}, status=status.HTTP_400_BAD_REQUEST)

            # Tạo nội dung
            references = search_serpapi_links(topic)
            content = generate_assistant_content(topic, references, professor_content, language)

            # Tạo Google Doc và lưu metadata
            doc_url = create_google_doc(f"✍️ Practice Materials - {topic}", content, creds, user.email)
            api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="assistant"
            )

            return Response({
                "message": "Document created successfully.",
                "doc_url": doc_url
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)