from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import search_serpapi_links, create_google_doc

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
SERPAPI_KEY = settings.SERPAPI_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY

def generate_professor_content(topic, references, language="en"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    references_text = "\n".join([f"- {title}: {url}" for title, url in references])

    if language == "vi":
        lang_note = "Please write the entire content in Vietnamese."
    else:
        lang_note = "Please write the entire content in English."

    prompt = f"""
You are a Professor Agent. Your task is to write a complete and well-structured academic knowledge base on the topic: "{topic}".

Your objective is to educate and empower learners by delivering a knowledge base that is clear, in-depth, and easy to integrate into digital notebooks or learning systems.

Your audience includes university students, researchers, and self-learners who want both clarity and depth. The output will be integrated into a research notebook, so formatting and structure are critical.

Please follow these requirements strictly:

---

📘 **1. Structure**

Break the output into the following sections using clear markdown headers:

- ## Introduction  
  A brief overview and motivation for the topic.

- ## Key Terminology  
  A bullet list of core terms with definitions.

- ## Fundamental Concepts  
  Explain from first principles. Assume the reader is a smart beginner.

- ## Advanced Topics  
  Explore complex ideas, models, or applications related to the topic.

- ## Current Developments  
  Include emerging trends, latest papers, or real-world impact.

- ## Practical Applications  
  Show how the topic is applied in industry, research, or daily life.

- ## Summary  
  Concise recap of main takeaways in bullet points.

- ## External References  
  Include the list of links provided. Do NOT invent new links.

---

🧠 **2. Style & Format**

- Use **markdown** formatting:
  - `##` for sections, `###` for subsections
  - `-` for bullet points
  - `**bold**` to highlight key terms

- Write in a clear, professional, academic tone  
- Be concise, logically structured, and free of fluff  
- Use short paragraphs, avoid walls of text

---

🌐 **3. Language**

{lang_note}

---

🔗 **4. References**

Use only these external references:

{references_text}

Follow the section headers exactly as given. Do not add extra sections. Do not skip any section.    
    """
    response = model.generate_content(prompt)
    return response.text    

class ProfessorAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic")
        user_id = request.data.get("user_id")

        if not topic or not user_id:
            return Response({"error": "Missing 'topic' or 'user_id'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)

            references = search_serpapi_links(topic)
            language = request.data.get("language", "en") 
            content = generate_professor_content(topic, references, language)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            doc_url = create_google_doc(f"📘 Knowledge Base - {topic}", content, creds, user.email)

            doc = api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="professor"
            )

            return Response({
                "message": "Document created successfully.",
                "doc_url": doc_url
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
