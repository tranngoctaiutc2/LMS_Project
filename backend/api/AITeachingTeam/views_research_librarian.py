from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db.models import Q
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import search_serpapi_links, create_google_doc, extract_text_from_google_doc

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
SERPAPI_KEY = settings.SERPAPI_KEY
genai.configure(api_key=settings.GEMINI_API_KEY)

def generate_librarian_content(topic, references=None, language="en", skip_online_courses_section=False):
    model = genai.GenerativeModel("gemini-1.5-flash")
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."

    online_courses_section = """
#### 🎓 Online Courses  
- List **4-6 online courses** with the following details:  
  - **Course Title and Link**: Name and direct URL to the course.  
  - **Platform**: Hosting platform (e.g., Coursera, Udemy, YouTube).  
  - **What’s Covered**: Brief description of course content (2-3 sentences).  
  - **Cost**: Free or paid (include price if known).  
  - **Certification**: Whether a certificate is available.  
  - **Difficulty**: Beginner, Intermediate, or Advanced.  
- Format as a markdown list with clear sub-bullets.
""" if not skip_online_courses_section else ""

    prompt = f"""
You are an expert Research Librarian Agent tasked with curating a comprehensive, high-quality, and structured list of learning resources for the topic: **"{topic}"**. Your goal is to assist university students, researchers, and self-learners by identifying trustworthy, up-to-date, and diverse resources suitable for beginners to intermediate learners. The output will be embedded in a digital research notebook or Google Document, designed to support learning and future summarization.

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting for clarity and visual appeal:

#### 🎯 Overview  
- Provide a concise introduction (3-5 sentences) explaining the value of curated resources for this topic.  
- Specify the types of learners these resources are suited for (e.g., beginners, students, developers).  
- Highlight the importance of reliable sources in mastering the topic.

#### 📖 Resource Categories  
Organize resources into the following categories, with **4-6 entries per category**:

##### 📰 Technical Blogs  
- **Title and Link**: Name and direct URL to the blog.  
- **Description**: Summarize the blog’s content (2-3 sentences).  
- **Why It’s Valuable**: Explain its unique contribution or relevance (1-2 sentences).  
- **Difficulty**: Beginner, Intermediate, or Advanced.  
- Format as a markdown list with sub-bullets.

##### 💻 GitHub Repositories  
- **Repo Name and Link**: Name and direct URL to the repository.  
- **Purpose and Features**: Describe the repo’s goal and key functionalities (2-3 sentences).  
- **Popularity**: Include stars/forks if available (e.g., "5k stars, 1k forks").  
- **Difficulty**: Beginner, Intermediate, or Advanced.  
- Format as a markdown list with sub-bullets.

##### 📜 Official Documentation  
- **Site Name and Link**: Name and direct URL to the documentation.  
- **What It Covers**: Summarize the content and scope (2-3 sentences).  
- **When to Use**: Suggest scenarios for using this resource (1-2 sentences).  
- **Difficulty**: Beginner, Intermediate, or Advanced.  
- Format as a markdown list with sub-bullets.

##### 📹 Video Tutorials  
- **Video/Course Title and Link**: Name and direct URL to the video or playlist.  
- **Platform**: Hosting platform (e.g., YouTube, Coursera).  
- **Duration**: Total duration (e.g., "2 hours" or "10 videos").  
- **Target Level**: Beginner, Intermediate, or Advanced.  
- Format as a markdown list with sub-bullets.

{online_courses_section}

#### 📝 Summary Recommendations  
- Summarize the best resources for:  
  - **Total Beginners**: 2-3 resources for starting from scratch.  
  - **Hands-on Learners**: 2-3 resources for practical application.  
  - **Theory-focused Learners**: 2-3 resources for conceptual understanding.  
  - **Developers/Practitioners**: 2-3 resources for professional use.  
- Format as a markdown list with **bold** categories and brief explanations (1-2 sentences each).

#### 🔗 External References  
{references_text}

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where appropriate.  
  - Add emojis (e.g., 📚, 🎯, 📰) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet accessible academic tone** suitable for university-level learners.  
- **Maximize detail in every section** to provide a robust resource list, including specific examples or use cases.  
- Use provided references from SerpApi to inform resource selection, prioritizing high-quality, reputable sources.  
- If no references are provided, rely on reliable general knowledge to curate resources.  
- Avoid low-quality, outdated, or broken links; verify resource relevance and accessibility.  
- Do not copy content verbatim from sources; write original summaries in your own words.  
- Ensure each resource includes a **difficulty level** to guide learners.  
- Focus on beginner-friendly resources unless specified otherwise.  

{lang_note}
    """
    return model.generate_content(prompt).text.strip()

def generate_librarian_from_professor(topic, professor_content, references=None, language="en", skip_online_courses_section=False):
    model = genai.GenerativeModel("gemini-1.5-flash")
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."

    online_courses_section = """
#### 🎓 Online Courses  
- List **4-6 online courses** with the following details:  
  - **Course Title and Link**: Name and direct URL to the course.  
  - **Platform**: Hosting platform (e.g., Coursera, Udemy, YouTube).  
  - **What’s Covered**: Brief description of course content (2-3 sentences).  
  - **Cost**: Free or paid (include price if known).  
  - **Certification**: Whether a certificate is available.  
  - **Difficulty**: Intermediate or Advanced (prioritize higher levels).  
- Format as a markdown list with clear sub-bullets.
""" if not skip_online_courses_section else ""

    prompt = f"""
You are an expert Research Librarian Agent tasked with curating a comprehensive, high-quality, and structured list of advanced learning resources for the topic: **"{topic}"**. Your goal is to assist university students, researchers, and professionals who have studied the provided Professor knowledge base by identifying trustworthy, up-to-date, and diverse resources that build upon this knowledge. The output will be embedded in a digital research notebook or Google Document, designed to support advanced learning and future summarization.

Here is the Professor knowledge base:

--- BEGIN KNOWLEDGE BASE ---
{professor_content}
--- END KNOWLEDGE BASE ---

---

### 📚 Structured Format

Follow this structure with enhanced markdown formatting for clarity and visual appeal:

#### 🎯 Overview  
- Provide a concise introduction (3-5 sentences) explaining the value of curated resources for learners familiar with the Professor knowledge base.  
- Specify the types of learners these resources are suited for (e.g., intermediate learners, developers, researchers).  
- Highlight how the resources extend the knowledge base for deeper understanding or practical application.

#### 📖 Resource Categories  
Organize resources into the following categories, with **4-6 entries per category**, prioritizing intermediate to advanced resources:

##### 📰 Technical Blogs  
- **Title and Link**: Name and direct URL to the blog.  
- **Description**: Summarize the blog’s content, linking to concepts from the knowledge base (2-3 sentences).  
- **Why It’s Valuable**: Explain how it extends the knowledge base (1-2 sentences).  
- **Difficulty**: Intermediate or Advanced.  
- Format as a markdown list with sub-bullets.

##### 💻 GitHub Repositories  
- **Repo Name and Link**: Name and direct URL to the repository.  
- **Purpose and Features**: Describe the repo’s goal and key functionalities, linking to knowledge base applications (2-3 sentences).  
- **Popularity**: Include stars/forks if available (e.g., "5k stars, 1k forks").  
- **Difficulty**: Intermediate or Advanced.  
- Format as a markdown list with sub-bullets.

##### 📜 Official Documentation  
- **Site Name and Link**: Name and direct URL to the documentation.  
- **What It Covers**: Summarize the content and scope, referencing knowledge base concepts (2-3 sentences).  
- **When to Use**: Suggest scenarios for using this resource to extend learning (1-2 sentences).  
- **Difficulty**: Intermediate or Advanced.  
- Format as a markdown list with sub-bullets.

##### 📹 Video Tutorials  
- **Video/Course Title and Link**: Name and direct URL to the video or playlist.  
- **Platform**: Hosting platform (e.g., YouTube, Coursera).  
- **Duration**: Total duration (e.g., "2 hours" or "10 videos").  
- **Target Level**: Intermediate or Advanced.  
- Format as a markdown list with sub-bullets.

{online_courses_section}

#### 📝 Summary Recommendations  
- Summarize the best resources for:  
  - **Intermediate Learners**: 2-3 resources to deepen understanding.  
  - **Hands-on Learners**: 2-3 resources for advanced practical application.  
  - **Theory-focused Learners**: 2-3 resources for complex concepts.  
  - **Developers/Practitioners**: 2-3 resources for professional projects.  
- Format as a markdown list with **bold** categories and brief explanations (1-2 sentences each).

#### 🔗 External References  
{references_text}

---

### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `#####` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where appropriate.  
  - Add emojis (e.g., 📚, 🎯, 📰) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet accessible academic tone** suitable for university-level learners.  
- **Maximize detail in every section** to provide a robust resource list, linking resources to specific concepts or applications from the knowledge base.  
- Use provided references from SerpApi to inform resource selection, prioritizing high-quality, reputable sources.  
- If no references are provided, rely on reliable general knowledge to curate resources.  
- Avoid low-quality, outdated, or broken links; verify resource relevance and accessibility.  
- Do not copy content verbatim from sources; write original summaries in your own words.  
- Ensure each resource includes a **difficulty level** (Intermediate or Advanced) to guide learners.  

{lang_note}
    """
    return model.generate_content(prompt).text.strip()

def _format_internal_courses(courses):
    if not courses:
        return ""
    markdown = "#### 🎓 Online Courses\n"
    for course in courses:
        markdown += (
            f"- **{course['title']}**\n"
            f"  - **Platform**: Internal LMS\n"
            f"  - **What’s Covered**: {course['description'][:100]}...\n"
            f"  - **Cost**: {'Free' if course['price'] == 0 else f'{course['price']} USD'}\n"
            f"  - **Certification**: {'Yes' if course['certificate'] else 'No'}\n"
            f"  - **[View Course](/courses/{course['slug']})**\n\n"
        )
    return markdown

def _format_external_courses(courses, topic):
    if not courses:
        return ""
    
    valid_courses = []
    platforms = ["coursera", "udemy", "edx", "khan academy", "pluralsight"]
    
    for title, url in courses:
        if ("course" in title.lower() or any(platform in title.lower() for platform in platforms)) and topic.lower() in title.lower():
            platform = next((p.title() for p in platforms if p in title.lower()), "Unknown")
            valid_courses.append({
                "title": title,
                "url": url,
                "platform": platform,
                "description": f"Khóa học về {topic} cung cấp kiến thức cơ bản đến trung cấp.",
                "cost": "Check on platform",
                "certificate": "Check on platform",
                "difficulty": "Beginner to Intermediate"
            })
    
    selected_courses = valid_courses[:3]
    if not selected_courses:
        return ""
    
    markdown = "#### 🎓 Online Courses\n"
    for course in selected_courses:
        markdown += (
            f"- **{course['title']}**\n"
            f"  - **Platform**: {course['platform']}\n"
            f"  - **What’s Covered**: {course['description'][:100]}...\n"
            f"  - **Cost**: {course['cost']}\n"
            f"  - **Certification**: {course['certificate']}\n"
            f"  - **Difficulty**: {course['difficulty']}\n"
            f"  - **[View Course]({course['url']})**\n\n"
        )
    return markdown
class ResearchLibrarianAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic")
        user_id = request.data.get("user_id")
        professor_input = request.data.get("professor_content")
        language = request.data.get("language", "en")

        if not user_id:
            return Response({"error": "Missing 'user_id'"}, status=status.HTTP_400_BAD_REQUEST)
        if language not in ["en", "vi"]:
            return Response({"error": "Invalid language. Use 'en' or 'vi'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            professor_content = ""
            if isinstance(professor_input, dict) and "doc_url" in professor_input:
                doc_url = professor_input["doc_url"]
                topic = topic or professor_input.get("topic", "")
                professor_content = extract_text_from_google_doc(doc_url, creds)
            elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com/document/"):
                professor_content = extract_text_from_google_doc(professor_input, creds)
            elif isinstance(professor_input, str) and professor_input.strip():
                professor_content = professor_input
            else:
                professor_content = ""
                if not topic:
                    return Response({"error": "Topic is required when professor_content is empty or invalid"}, status=status.HTTP_400_BAD_REQUEST)

            related_courses = list(
                api_models.Course.objects.filter(
                    Q(title__icontains=topic) | Q(description__icontains=topic)
                ).values("title", "description", "slug", "price", "certificate")[:5]
            )
            has_internal_courses = bool(related_courses)

            references = search_serpapi_links(topic)

            if professor_content.strip():
                content = generate_librarian_from_professor(
                    topic=topic,
                    professor_content=professor_content,
                    references=references[:2],
                    language=language,
                    skip_online_courses_section=has_internal_courses
                )
            else:
                content = generate_librarian_content(
                    topic=topic,
                    references=references[:2],
                    language=language,
                    skip_online_courses_section=has_internal_courses
                )

            if has_internal_courses:
                content += "\n" + _format_internal_courses(related_courses)
            else:
                content += "\n" + _format_external_courses(topic)

            doc_url = create_google_doc(f"📚 Research Resources - {topic}", content, creds, user.email)

            api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="librarian",
                language=language
            )

            return Response({"message": "Document created successfully", "doc_url": doc_url})

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
