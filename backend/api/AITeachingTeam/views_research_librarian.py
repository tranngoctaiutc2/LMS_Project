from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import search_serpapi_links, create_google_doc

GEMINI_API_KEY = settings.GEMINI_API_KEY

def generate_librarian_content(topic, references, language="en"):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    references_text = "\n".join([f"- {title}: {url}" for title, url in references])

    lang_note = "Please write the entire content in Vietnamese." if language == "vi" else "Please write the entire content in English."

    prompt = f"""
You are a Research Librarian Agent. Your task is to curate a high-quality, structured list of learning resources for the topic: "{topic}".

Your objective is to assist learners and researchers by identifying and organizing trustworthy, up-to-date, and diverse resources. These resources will be embedded in a digital research notebook or Google Document.

Please follow the instructions below strictly:

---

📂 **1. Structure**

Present the output using the following markdown format and sections:

- ## Overview  
  Briefly explain the value of curated resources for this topic and what types of learners these resources are suited for.

- ## Resource Categories  
  Organize the resources into the following categories. For each category, include at least 3 entries:
  
  ### 1. Technical Blogs  
  - Title  
  - Link  
  - Description  
  - **Why it's valuable**
  - Estimated difficulty: Beginner / Intermediate / Advanced

  ### 2. GitHub Repositories  
  - Repo name and link  
  - Purpose and main features  
  - **Usage popularity (stars/forks)** if known  
  - Estimated difficulty

  ### 3. Official Documentation  
  - Site name and link  
  - What it covers  
  - When to use it

  ### 4. Video Tutorials  
  - Video/course title  
  - Platform (YouTube, Coursera, etc.)  
  - Duration  
  - Target level

  ### 5. Online Courses  
  - Course title and link  
  - Platform  
  - What’s covered  
  - Cost (if known)  
  - Certification available?

- ## Summary Recommendations  
  Summarize which resources are best for:
    - Total beginners
    - Hands-on learners
    - Theory-focused learners
    - Developers or practitioners

---

📝 **2. Style & Format**

- Use **markdown** formatting:
  - `##` for sections, `###` for categories
  - `-` for each entry, with **bold** highlights for key info

- Be concise, objective, and informative  
- Do not copy entire paragraphs from sources — write your own summaries  
- Mention difficulty level for each resource

---

🔍 **3. Source Discovery**

Use the SerpAPI search tool to discover:
- Blogs, papers, GitHub repos, videos, documentation, and courses  
- Prioritize resources with good community feedback or reputation  
- Avoid low-quality, outdated, or broken links

---

🌐 **4. Language**

{lang_note}

---

⚠️ **5. Integration Guidelines**

The content will be formatted into a Google Doc and embedded in a research notebook. Ensure consistent markdown formatting and clean structure.

Follow the section headers exactly as given. Do not add extra sections. Do not skip any section.
    """
    response = model.generate_content(prompt)
    return response.text    


class ResearchLibrarianAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic")
        user_id = request.data.get("user_id")

        if not topic or not user_id:
            return Response({"error": "Missing 'topic' or 'user_id'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            language = request.data.get("language", "en") 
            references = search_serpapi_links(topic)
            content = generate_librarian_content(topic, references, language)
            doc_url = create_google_doc(f"📚 Research Resources - {topic}", content, user.email)

            doc = api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="librarian"
            )

            return Response({
                "message": "Document created successfully.",
                "doc_url": doc_url
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
