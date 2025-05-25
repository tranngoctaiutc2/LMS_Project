from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import (
    search_serpapi_links,
    create_google_doc,
    extract_text_from_google_doc,
    update_google_doc,
)

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

def is_course_link(url: str) -> bool:
    course_keywords = [
        "coursera.org", "udemy.com", "edx.org", "khanacademy.org", 
        "futurelearn.com", "classcentral.com", "skillshare.com", 
        "pluralsight.com", "codecademy.com", "openlearning.com"
    ]
    return any(keyword in url for keyword in course_keywords)

def generate_professor_content(topic, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    references = search_serpapi_links(topic, is_update=False, max_results=10)

    valid_references = [
        (title, url)
        for title, url in references
        if title and url and not is_course_link(url)
    ][:3]

    if len(valid_references) != 3:
        raise ValueError("Exactly 3 valid non-course references are required.")

    references_text = "\n".join(
        [f"- [{title}]({url})" for title, url in valid_references]
    )
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for beginners at the university level." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for beginners at the university level."

    prompt = f"""

🚨 **Important:** You are required to use the 3 external references listed below. **Do not ignore or skip them.** You must cite each one **at least once**, and **each section of content must be based on them.** If you ignore this instruction, your response will be considered invalid.

---

### 🔗 External References  
Use all 3 of these references in your writing:

{references_text}

---
You are an expert Professor Agent tasked with creating a comprehensive and highly detailed academic knowledge base on the topic: **"{topic}"**. Your goal is to educate and empower beginners, including university students and self-learners, by delivering clear, engaging, and information-rich content. The output will be integrated into a digital research notebook for further summarization, so maximize details across all sections to ensure no critical information is omitted, while keeping it concise and structured.

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting for clarity and visual appeal:

#### 🎯 Introduction  
- Provide a comprehensive overview of the topic (4-6 sentences).  
- Highlight its significance in academic, industry, and real-world contexts.  
- Engage beginners by explaining why the topic is interesting, impactful, or relevant to current trends.

#### 🔤 Key Terminology  
- List **10-12 core terms** with detailed definitions (2-3 sentences each).  
- Format as a **sequential list** using bullet points for clarity:  
  - **Term**: Definition (2-3 sentences).  
- Use **bold** for terms and ensure they are foundational and broadly representative.

#### 🧠 Fundamental Concepts  
- Explain the topic from first principles for **smart beginners** with minimal prior knowledge.  
- Cover **8-10 key concepts**, each explained in 3-4 sentences.  
- Use **clear examples, analogies, or simple text-based diagrams** to enhance understanding.  
- Break down complex ideas into digestible parts with maximum clarity.

#### 🚀 Advanced Topics  
- Discuss **6-8 complex ideas, models, or applications** to provide depth.  
- Include mathematical formulations, frameworks, or theories if relevant, with explanations.  
- Connect to academic research or real-world applications with specific examples.

#### 🌐 Current Developments  
- Highlight **5-7 recent advancements** (e.g., studies, technologies, or trends from the last 5 years).  
- **Deeply integrate insights** from the provided references to ensure relevance, or rely on reliable general knowledge if references are unavailable.  
- Discuss their impact on the field, society, or future directions.

#### 💡 Practical Applications  
- Describe **6-8 real-world applications** of the topic.  
- Include specific examples from industry, research, or daily life, with **case studies or scenarios** to make applications vivid.  
- Explain how the topic solves real problems or creates opportunities.

#### 📝 Summary  
- Recap the main takeaways in **8-12 concise bullet points**.  
- Emphasize key insights, their significance, and implications for beginners and future learning.

### 🔗 External References  
{references_text}

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and sequential lists where specified.  
  - Add emojis (e.g., 📚, 🎯, 🔤) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet accessible academic tone** suitable for beginners.  
- **Maximize detail in every section** to provide a robust foundation for summarization, including examples, data, or case studies where possible.  
- **Prioritize insights from provided references** (from SerpApi) if available, citing them naturally (e.g., "According to [reference title]...").  
- If no references are provided, use reliable general knowledge to generate content.  
- Avoid fluff, repetition, or overly technical jargon unless defined.  
- Include text-based descriptions of diagrams or visuals if they clarify concepts.  
- Do not invent new references; use only the provided ones.  
- You must cite **at least once from each of the 3 references** above.
- Use natural academic phrasing such as:  
  *“According to [title]...”* or *“As noted in [title]...”*
- Do not ignore or replace these references with model knowledge — you may combine them, but must cite.

{lang_note}
    """
    return model.generate_content(prompt).text.strip()


def generate_professor_update(topic, previous_summary, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    raw_references = search_serpapi_links(topic, is_update=True, max_results=5)
    new_references = [
        (title, url)
        for title, url in raw_references
        if title and url and not is_course_link(url)
    ][:2]

    if len(new_references) != 2:
        raise ValueError("Exactly 2 valid non-course references are required for update.")

    references_text = "\n".join([
        f"{i+1}. [{title}]({url})"
        for i, (title, url) in enumerate(new_references)
    ])
    lang_note = "Please write the entire content in Vietnamese, using formal academic language suitable for university-level learners with some background knowledge." if language == "vi" else "Please write the entire content in English, using formal academic language suitable for university-level learners with some background knowledge."

    prompt = f"""
You are an expert Professor Agent tasked with updating an existing academic knowledge base on the topic: **"{topic}"**. Your goal is to provide advanced, cutting-edge, and highly detailed insights for university students, researchers, and self-learners with some background knowledge. The update should build on the existing content without repetition, focusing on novel and in-depth advancements for integration into a digital research notebook. Maximize details to ensure comprehensive coverage for future summarization.

Here is a summary of the existing content:

--- BEGIN SUMMARY ---
{previous_summary}
--- END SUMMARY ---

---

### 🔄 Update: Recent Developments or Enhancements  
- Introduce **5-7 new insights, advancements, or trends** (from the last 3 years) not covered in the summary.  
- **Deeply analyze insights** from the provided references (from SerpApi) if available, or rely on reliable general knowledge if references are unavailable.  
- Connect new information to the existing summary to show progression or expansion, with specific examples or data.  
- Use **specific case studies, data, mathematical formulations, or frameworks** to illustrate updates, ensuring maximum depth.  
- Discuss implications for the field, industry, or society.

#### 📝 Update Summary  
- Recap the new insights in **8-12 concise bullet points**.  
- Emphasize their significance, novelty, and connection to the existing content.

#### 🔗 New References  
Below are **2 trusted sources** for this update. You must **reference both** in the updated content.

{references_text}

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables if appropriate.  
  - Add emojis (e.g., 🔄, 🔗) for visual distinction.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal, academic tone** suitable for learners with some background knowledge.  
- **Maximize detail in all sections** to provide a robust foundation for summarization, including examples, data, or case studies.  
- **Prioritize deep analysis of provided references**, citing them naturally (e.g., "According to [reference title]...").  
- Avoid repeating or rephrasing content from the summary.  
- Include text-based descriptions of diagrams or visuals if they clarify new concepts.  
- Do not invent new references; use only the provided ones.  
- Integrate at least **1 insight from each reference** above.
- Cite them naturally as: *“According to [title]...”*, *“As noted in [title]...”*.
- You may combine insights from references and model knowledge, but citation is required.

{lang_note}
    """
    return model.generate_content(prompt).text.strip()

class ProfessorAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic")
        user_id = request.data.get("user_id")
        doc_url = request.data.get("doc_url", None)
        language = request.data.get("language", "en")

        if not topic or not user_id:
            return Response({"error": "Missing 'topic' or 'user_id'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            if doc_url:
                previous_summary = extract_text_from_google_doc(doc_url, creds)
                update_content = generate_professor_update(topic, previous_summary, language)
                update_google_doc(doc_url, update_content, creds)
                return Response({
                    "message": "Document updated successfully.",
                    "doc_url": doc_url
                })

            else:
                content = generate_professor_content(topic, language)
                doc_url = create_google_doc(
                    title=f"📘 Knowledge Base - {topic}",
                    content=content,
                    creds=creds,
                    share_email=user.email
                )

                api_models.UserDocument.objects.create(
                    user=user,
                    topic=topic,
                    doc_url=doc_url,
                    ai_type="professor",
                    language=language
                )

                return Response({
                    "message": "Document created successfully.",
                    "doc_url": doc_url
                })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
