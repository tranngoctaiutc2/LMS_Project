from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import create_google_doc, update_google_doc, extract_text_from_google_doc

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)


def generate_advisor_prompt(topic, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."

    prompt = f"""
You are an expert Academic Advisor tasked with creating a comprehensive and detailed learning roadmap for the topic: **"{topic}"**. Your goal is to guide learners from beginner to expert, providing a clear, structured, and engaging path that maximizes understanding and skill development. The roadmap should be suitable for university students and self-learners, designed for integration into a digital research notebook, and detailed enough to support future summarization.

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting for clarity and visual appeal:

#### 🎯 Overview  
- Provide a concise introduction to the topic (3-5 sentences).  
- Explain its importance in academic, industry, or real-world contexts.  
- Highlight why a structured roadmap is essential for mastering this topic.

#### 📋 Learning Objectives  
- List **6-8 specific, measurable objectives** that learners will achieve by following the roadmap (e.g., "Understand core concepts of X", "Apply Y in a real-world project").  
- Format as a markdown list with **bold** objectives for emphasis.  
- Ensure objectives cover knowledge, skills, and practical applications.

#### 🗺 Roadmap Structure  
- Divide the learning journey into **4-6 phases** (e.g., "Foundations", "Intermediate", "Advanced", "Expert").  
- For each phase, include:  
  - **Phase Name**: A clear, descriptive title.  
  - **Prerequisites**: Skills or knowledge required before starting (e.g., "Basic math" or "None").  
  - **Key Topics**: 4-6 topics to cover, with brief descriptions (1-2 sentences each).  
  - **Resources**: 3-5 recommended resources (books, online courses, websites, or tools), with links if possible.  
  - **Time Estimate**: Estimated hours/weeks to complete, aligned with the total study duration.  
- Format each phase as a subsection (`#####`) with the following structure:  
  - **Topic**: [Topic name]  
    - Description: [Brief description of the topic]  
    - Resources: [List of recommended resources]  

#### 🕒 Suggested Learning Schedule  
- Create a detailed schedule for the total study duration: **{study_duration}**.  
- Break down the duration into weeks or months (e.g., "Week 1-2", "Month 1").  
- Assign specific tasks or topics from the roadmap to each time period, with estimated hours per week.  
- Include milestones (e.g., "Complete a small project by Week 4").  
- Format the schedule as follows:  
  - **Time Period**: [Specific time period, e.g., Week 1-2]  
    - Tasks/Topics: [List of tasks or topics]  
    - Hours: [Estimated hours]  
    - Milestones: [Description of milestone, if any]   

#### 📝 Summary  
- Recap the roadmap in **6-8 concise bullet points**.  
- Emphasize key phases, objectives, and expected outcomes for learners.  
- Highlight how the roadmap prepares learners for academic or professional success.

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where specified.  
  - Add emojis (e.g., 📚, 🎯, 🗺) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet encouraging academic tone** suitable for beginners to advanced learners.  
- **Maximize detail in every section** to provide a robust foundation for learning and summarization.  
- Align the roadmap with the total study duration (**{study_duration}**), ensuring realistic time estimates and balanced pacing.  
- Recommend high-quality, accessible resources (e.g., open-access materials, MOOCs, or reputable websites).  
- Avoid fluff, repetition, or overly technical jargon unless explained.  
- Do not include external references unless specified; rely on general knowledge or provided resources.  

{lang_note}
    """
    return model.generate_content(prompt).text.strip()


def generate_advisor_from_professor(topic, professor_content, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."

    prompt = f"""
You are an expert Academic Advisor tasked with creating a comprehensive and detailed learning roadmap for the topic: **"{topic}"**. Your goal is to guide learners from beginner to expert, leveraging an existing professor knowledge base to ensure accuracy and depth. The roadmap should be suitable for university students and self-learners, designed for integration into a digital research notebook, and detailed enough to support future summarization.

Here is the professor knowledge base:

--- BEGIN KNOWLEDGE BASE ---
{professor_content}
--- END KNOWLEDGE BASE ---

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting for clarity and visual appeal:

#### 🎯 Overview  
- Provide a concise introduction to the topic (3-5 sentences), based on the knowledge base.  
- Explain its importance in academic, industry, or real-world contexts.  
- Highlight how the roadmap will use the knowledge base to guide learners effectively.

#### 📋 Learning Objectives  
- List **6-8 specific, measurable objectives** derived from the knowledge base (e.g., "Master key concepts like X", "Develop skills in Y").  
- Format as a markdown list with **bold** objectives for emphasis.  
- Ensure objectives align with the knowledge base and cover knowledge, skills, and applications.

#### 🗺 Roadmap Structure  
- Divide the learning journey into **4-6 phases** (e.g., "Foundations", "Intermediate", "Advanced", "Expert"), based on the knowledge base.  
- For each phase, include:  
  - **Phase Name**: A clear, descriptive title.  
  - **Prerequisites**: Skills or knowledge required, referencing the knowledge base (e.g., "Understand terms from Key Terminology").  
  - **Key Topics**: 4-6 topics from the knowledge base (e.g., from Fundamental Concepts, Advanced Topics), with brief descriptions (1-2 sentences each).  
  - **Resources**: 3-5 recommended resources (books, courses, websites, or tools), prioritizing those mentioned in the knowledge base’s references.  
  - **Time Estimate**: Estimated hours/weeks, aligned with the total study duration: **{study_duration}**.  
- Format each phase as a subsection (`#####`) with the following structure: 
  - **Topic**: [Topic name]  
    - Description: [Brief description of the topic]  
    - Resources: [List of recommended resources]

#### 🕒 Suggested Learning Schedule  
- Create a detailed schedule for the total study duration: **{study_duration}**.  
- Break down the duration into weeks or months (e.g., "Week 1-2", "Month 1").  
- Assign specific tasks or topics from the roadmap to each time period, with estimated hours per week.  
- Include milestones (e.g., "Complete a project based on Practical Applications by Month 2").  
- Format the schedule as follows:  
  - **Time Period**: [Specific time period, e.g., Week 1-2]  
    - Tasks/Topics: [List of tasks or topics]  
    - Hours: [Estimated hours]  
    - Milestones: [Description of milestone, if any]  

#### 📝 Summary  
- Recap the roadmap in **6-8 concise bullet points**.  
- Emphasize how the knowledge base shapes the roadmap, key phases, and expected outcomes.  
- Highlight readiness for academic or professional applications.

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where specified.  
  - Add emojis (e.g., 📚, 🎯, 🗺) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet encouraging academic tone** suitable for beginners to advanced learners.  
- **Maximize detail in every section**, leveraging the knowledge base for accuracy and depth, to support summarization.  
- Align the roadmap with the total study duration (**{study_duration}**), ensuring realistic time estimates and balanced pacing.  
- Use resources from the knowledge base’s references where possible; supplement with high-quality, accessible resources (e.g., MOOCs, open-access materials).  
- Avoid fluff, repetition, or overly technical jargon unless explained.  
- Do not invent new references; use only those in the knowledge base or general knowledge.  

{lang_note}
    """
    return model.generate_content(prompt).text.strip()


def generate_advisor_update(content_summary, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."

    prompt = f"""
You are an expert Academic Advisor tasked with updating an existing learning roadmap to reflect a new study duration: **{study_duration}**. Your goal is to adjust the roadmap while preserving its structure, objectives, and depth, ensuring it remains clear, detailed, and suitable for university students and self-learners. The updated roadmap should support integration into a digital research notebook and future summarization.

Here is the current roadmap summary:

--- BEGIN SUMMARY ---
{content_summary}
--- END SUMMARY ---

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting, updating only the relevant sections:

#### 🕒 Updated Suggested Learning Schedule  
- Adjust the schedule to fit the new study duration: **{study_duration}**.  
- Break down the duration into weeks or months (e.g., "Week 1-2", "Month 1").  
- Reassign tasks or topics from the original roadmap to each time period, with updated estimated hours per week.  
- Update milestones to align with the new timeline (e.g., "Complete a project by Week 3").  
- Format the schedule as follows:  
  - **Time Period**: [Specific time period, e.g., Week 1-2]  
    - Tasks/Topics: [List of tasks or topics]  
    - Hours: [Estimated hours]  
    - Milestones: [Description of milestone, if any]  

#### 📝 Updated Summary  
- Recap the updated roadmap in **6-8 concise bullet points**.  
- Highlight changes to the schedule, new milestones, and how the new duration affects learning outcomes.  
- Emphasize readiness for academic or professional success.

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where specified.  
  - Add emojis (e.g., 🕒, 📝) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet encouraging academic tone** suitable for learners.  
- **Maximize detail in updated sections** to maintain depth and support summarization.  
- Adjust pacing and time estimates to align with the new study duration (**{study_duration}**), ensuring realistic and balanced scheduling.  
- Preserve the original roadmap’s objectives and structure, only updating time-related elements.  
- Avoid fluff, repetition, or introducing new topics unless necessary.  
- Do not include external references; rely on the provided summary.  

{lang_note}
    """
    return model.generate_content(prompt).text.strip()


class AcademicAdvisorAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            topic = request.data.get("topic")
            user_id = request.data.get("user_id")
            language = request.data.get("language", "en")
            study_duration = request.data.get("study_duration", "").strip()

            professor_input = request.data.get("professor_content")
            advisor_input = request.data.get("advisor_content")

            if not topic or not user_id or not study_duration:
                return Response({"error": "Missing topic, user_id, or study_duration"}, status=400)

            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            if advisor_input:
                if isinstance(advisor_input, dict) and "doc_url" in advisor_input:
                    doc_url = advisor_input["doc_url"]
                elif isinstance(advisor_input, str) and advisor_input.startswith("https://docs.google.com"):
                    doc_url = advisor_input
                else:
                    return Response({"error": "Invalid advisor_content"}, status=400)

                existing_content = extract_text_from_google_doc(doc_url, creds)

                try:
                    existing_doc = api_models.UserDocument.objects.get(doc_url=doc_url, ai_type="advisor")
                    old_duration = existing_doc.study_duration or ""
                except api_models.UserDocument.DoesNotExist:
                    old_duration = ""

                if study_duration.lower().strip() == old_duration.lower().strip():
                    return Response({"error": "New study_duration must be different from existing one."}, status=400)

                update_text = generate_advisor_update(existing_content, study_duration, language)
                update_google_doc(doc_url, update_text, creds)

                new_combined_duration = f"{old_duration} + {study_duration}" if old_duration else study_duration
                existing_doc.study_duration = new_combined_duration
                existing_doc.save()

                return Response({"message": "Document updated with new study duration.", "doc_url": doc_url})

            if professor_input:
                if isinstance(professor_input, dict) and "doc_url" in professor_input:
                    professor_content = extract_text_from_google_doc(professor_input["doc_url"], creds)
                elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com"):
                    professor_content = extract_text_from_google_doc(professor_input, creds)
                elif isinstance(professor_input, str):
                    professor_content = professor_input
                else:
                    return Response({"error": "Invalid professor_content format"}, status=400)
            
                content = generate_advisor_from_professor(topic, professor_content, study_duration, language)

            else:
                content = generate_advisor_prompt(topic, study_duration, language)

            doc_url = create_google_doc(f"🗺️ Learning Roadmap - {topic}", content, creds, user.email)

            api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="advisor",
                language=language,
                study_duration=study_duration
            )

            return Response({"message": "Document created successfully", "doc_url": doc_url})

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
