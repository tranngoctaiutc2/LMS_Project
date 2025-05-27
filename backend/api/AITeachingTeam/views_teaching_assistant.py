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
genai.configure(api_key=GEMINI_API_KEY)

def generate_assistant_content(topic, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    references = search_serpapi_links(topic, is_update=False, max_results=10)
    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    prompt = f"""
You are a Teaching Assistant Agent tasked with creating a comprehensive, high-quality, and structured set of practice materials for the topic: **"{topic}"**. Your goal is to support university students, researchers, and self-learners in mastering the topic through engaging exercises that increase in difficulty. The output will be embedded in a digital research notebook or Google Document, designed to facilitate interactive learning and future reference.

---

#### 🎯 Overview  
- Provide a concise introduction (3-5 sentences) explaining the value of these practice materials for mastering the topic.  
- Specify the types of learners these materials are suited for (e.g., beginners, students, developers).  
- Highlight the importance of structured, progressive exercises in achieving proficiency.

#### 📚 Structured Practice Materials  
Organize exercises into the following sections, ensuring clarity and progression in difficulty:

##### 📘 Progressive Exercises  
- Break exercises into **Beginner**, **Intermediate**, and **Advanced** levels, with **3-5 exercises per level**.  
- For each exercise, include:  
  - **Title**: A short, descriptive title.  
  - **Task**: The exercise question or task (2-3 sentences).  
  - **Real-world Context**: A practical scenario (e.g., "In a hospital...", "In a financial app...") (1-2 sentences).  
  - **Difficulty**: Clearly state Beginner, Intermediate, or Advanced.  
- Use `### Beginner`, `### Intermediate`, `### Advanced` for subsections.  
- Format as a markdown list with clear sub-bullets.

##### ❓ Quiz Questions  
- Provide **5-10 multiple-choice or short-answer questions**.  
- For each question, include:  
  - **Question**: Clearly stated question.  
  - **Options**: 4 options for multiple-choice, or a prompt for short-answer.  
  - **Correct Answer**: Mark the correct answer clearly.  
  - **Explanation**: Provide a detailed explanation (2-3 sentences).  
- Format as a markdown list with numbered questions and sub-bullets.

##### 🛠 Hands-on Projects  
- Provide **1-2 larger tasks or mini-projects** integrating multiple concepts.  
- For each project, include:  
  - **Objective**: The goal of the project (1-2 sentences).  
  - **Description**: Detailed task description (3-4 sentences).  
  - **Expected Output/Result**: Describe the desired outcome (1-2 sentences).  
  - **Required Tools/Libraries**: List any tools or libraries needed (e.g., Python, pandas).  
- Format as a markdown list with clear sub-bullets.

##### 🌍 Real-world Scenarios  
- Describe **2-3 practical applications** of the topic.  
- For each application, include:  
  - **Description**: Explain the application (2-3 sentences).  
  - **Challenge Question**: Provide 1-2 challenge questions to apply the concept (1-2 sentences each).  
- Format as a markdown list with sub-bullets.

##### ✅ Solutions & Explanations  
- Provide **detailed solutions** for all exercises, quiz questions, and challenge questions.  
- Include reasoning for each solution (2-4 sentences per item).  
- Format as a markdown list, aligning with the corresponding question or task.

#### 🔗 External References  
{references_text}

---

#### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `###` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where appropriate.  
  - Add emojis (e.g., 📚, 🎯, ❓) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet accessible academic tone** suitable for university-level learners.  
- **Maximize detail in every section** to provide robust practice materials, including specific examples or use cases.  
- Use provided references from SerpApi to inspire exercises, prioritizing high-quality, reputable sources.  
- If no references are provided, rely on reliable general knowledge to create exercises.  
- Avoid copying content verbatim from sources; write original exercises and solutions in your own words.  
- Ensure each exercise and question includes a **difficulty level** to guide learners.  
- Focus on beginner-to-intermediate exercises unless specified otherwise.  

{lang_note}
    """
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_assistant_from_professor(topic, professor_content, language="en"):
    model = genai.GenerativeModel("gemini-1.5-flash")
    references = search_serpapi_links(topic, is_update=False, max_results=10)
    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    prompt = f"""
You are a Teaching Assistant Agent tasked with creating a comprehensive, high-quality, and structured set of practice materials for the topic: **"{topic}"**, based on the provided Professor knowledge base. Your goal is to support university students, researchers, and professionals in deepening their understanding through engaging exercises that build upon the knowledge base and increase in difficulty. The output will be embedded in a digital research notebook or Google Document, designed to facilitate interactive learning and future reference.

---

#### 📜 Professor Knowledge Base  
{professor_content}

---

#### 🎯 Overview  
- Provide a concise introduction (3-5 sentences) explaining how these practice materials extend the Professor knowledge base for mastering the topic.  
- Specify the types of learners these materials are suited for (e.g., intermediate learners, developers, researchers).  
- Highlight how the exercises align with the knowledge base to achieve proficiency.

#### 📚 Structured Practice Materials  
Organize exercises into the following sections, ensuring clarity and progression in difficulty, and linking to the knowledge base where relevant:

##### 📘 Progressive Exercises  
- Break exercises into **Beginner**, **Intermediate**, and **Advanced** levels, with **3-5 exercises per level**.  
- For each exercise, include:  
  - **Title**: A short, descriptive title.  
  - **Task**: The exercise question or task, referencing knowledge base concepts (2-3 sentences).  
  - **Real-world Context**: A practical scenario (e.g., "In a hospital...", "In a financial app...") (1-2 sentences).  
  - **Difficulty**: Clearly state Beginner, Intermediate, or Advanced.  
- Use `### Beginner`, `### Intermediate`, `### Advanced` for subsections.  
- Format as a markdown list with clear sub-bullets.

##### ❓ Quiz Questions  
- Provide **5-10 multiple-choice or short-answer questions**, aligned with the knowledge base.  
- For each question, include:  
  - **Question**: Clearly stated question.  
  - **Options**: 4 options for multiple-choice, or a prompt for short-answer.  
  - **Correct Answer**: Mark the correct answer clearly.  
  - **Explanation**: Provide a detailed explanation, referencing the knowledge base (2-3 sentences).  
- Format as a markdown list with numbered questions and sub-bullets.

##### 🛠 Hands-on Projects  
- Provide **1-2 larger tasks or mini-projects** integrating multiple concepts from the knowledge base.  
- For each project, include:  
  - **Objective**: The goal of the project, tied to the knowledge base (1-2 sentences).  
  - **Description**: Detailed task description (3-4 sentences).  
  - **Expected Output/Result**: Describe the desired outcome (1-2 sentences).  
  - **Required Tools/Libraries**: List any tools or libraries needed (e.g., Python, pandas).  
- Format as a markdown list with clear sub-bullets.

##### 🌍 Real-world Scenarios  
- Describe **2-3 practical applications** of the topic, extending the knowledge base.  
- For each application, include:  
  - **Description**: Explain the application, linking to the knowledge base (2-3 sentences).  
  - **Challenge Question**: Provide 1-2 challenge questions to apply the concept (1-2 sentences each).  
- Format as a markdown list with sub-bullets.

##### ✅ Solutions & Explanations  
- Provide **detailed solutions** for all exercises, quiz questions, and challenge questions, referencing the knowledge base.  
- Include reasoning for each solution (2-4 sentences per item).  
- Format as a markdown list, aligning with the corresponding question or task.

#### 🔗 External References  
{references_text}

---

#### 🛠 Additional Instructions  
- Use **enhanced markdown** for readability:  
  - `####` for main sections, `###` for subsections.  
  - Use `-` for bullet points, `**bold** for emphasis, and tables where appropriate.  
  - Add emojis (e.g., 📚, 🎯, ❓) to make sections visually distinct.  
  - Ensure short paragraphs (2-4 sentences) and clear spacing.  
- Write in a **formal yet accessible academic tone** suitable for university-level learners.  
- **Maximize detail in every section** to provide robust practice materials, linking exercises to specific concepts or applications from the knowledge base.  
- Use provided references from SerpApi to inspire exercises, prioritizing high-quality, reputable sources.  
- If no references are provided, rely on reliable general knowledge to create exercises.  
- Avoid copying content verbatim from sources; write original exercises and solutions in your own words.  
- Ensure each exercise and question includes a **difficulty level** to guide learners.  
- Focus on intermediate-to-advanced exercises unless specified otherwise.  

{lang_note}
    """
    response = model.generate_content(prompt)
    return response.text.strip()

class TeachingAssistantAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            if not all([hasattr(settings, attr) for attr in ['CREDENTIALS_FILE', 'GEMINI_API_KEY', 'SERPAPI_KEY']]):
                return Response({"error": "Missing API configuration"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            topic = request.data.get("topic")
            user_id = request.data.get("user_id")
            professor_input = request.data.get("professor_content", "")
            language = request.data.get("language", "en")

            if not topic or not user_id:
                return Response(
                    {"error": "Missing required fields: topic or user_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

            if isinstance(professor_input, dict) and "doc_url" in professor_input:
                doc_url = professor_input["doc_url"]
                topic = topic or professor_input.get("topic", "")
                professor_content = extract_text_from_google_doc(doc_url, creds)
                content = generate_assistant_from_professor(topic, professor_content, language)
            elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com/document/"):
                professor_content = extract_text_from_google_doc(professor_input, creds)
                content = generate_assistant_from_professor(topic, professor_content, language)
            elif isinstance(professor_input, str):
                content = generate_assistant_from_professor(topic, professor_input, language)
            else:
                content = generate_assistant_content(topic, language)

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