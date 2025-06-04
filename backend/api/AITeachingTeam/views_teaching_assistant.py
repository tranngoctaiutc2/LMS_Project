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
import time


SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
SERPAPI_KEY = settings.SERPAPI_KEY
genai.configure(api_key=GEMINI_API_KEY)


def generate_content_in_chunks(topic, language="en"):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    references = search_serpapi_links(topic, is_update=False, max_results=10)
    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."
    
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    exercises_prompt = f"""
You are a Teaching Assistant Agent creating comprehensive practice materials for: **"{topic}"**

{lang_note}

Create ONLY the following sections:

#### 🎯 Overview  
- Provide a concise introduction (3-5 sentences) explaining the value of these practice materials.
- Specify target learners and highlight the importance of structured exercises.

#### 🔗 External References  
{references_text}

#### 📚 Progressive Exercises  

**🟢 BEGINNER LEVEL**

Exercise 1:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Beginner

Exercise 2:
**Title:** [Short descriptive title]  
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Beginner

Exercise 3:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise] 
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Beginner

Exercise 4:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Beginner

**🟡 INTERMEDIATE LEVEL**

Exercise 1:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Intermediate

Exercise 2:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Intermediate

Exercise 3:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Intermediate

Exercise 4:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Intermediate

**🔴 ADVANCED LEVEL**

Exercise 1:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Advanced

Exercise 2:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Advanced

Exercise 3:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Advanced

Exercise 4:
**Title:** [Short descriptive title]
**Task:** [2-3 sentences describing the exercise]
**Real-world Context:** [1-2 sentences with practical scenario]
**Difficulty:** Advanced

Use **enhanced markdown** with emojis, clear spacing, and avoid tables completely.
    """

    quiz_prompt = f"""
Create ONLY quiz questions for the topic: **"{topic}"**

{lang_note}

#### ❓ Quiz Questions  

**Question 1:**
[Clear question statement]
- A) [Option A]
- B) [Option B] 
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 2:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C] 
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 3:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 4:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 5:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 6:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 7:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]

**Question 8:**
[Clear question statement]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed 2-3 sentence explanation]
    """

    projects_prompt = f"""
Create ONLY projects and scenarios for the topic: **"{topic}"**

{lang_note}

#### 🛠 Hands-on Projects  

**Project 1:**
**Objective:** [1-2 sentences describing the goal]
**Description:** [3-4 sentences with detailed task description]
**Expected Output/Result:** [1-2 sentences describing desired outcome]
**Required Tools/Libraries:** [List tools/libraries needed]

**Project 2:**
**Objective:** [1-2 sentences describing the goal]
**Description:** [3-4 sentences with detailed task description]
**Expected Output/Result:** [1-2 sentences describing desired outcome]
**Required Tools/Libraries:** [List tools/libraries needed]

#### 🌍 Real-world Scenarios  

**Scenario 1:**
**Description:** [2-3 sentences explaining the application]
**Challenge Question 1:** [1-2 sentences with challenge question]
**Challenge Question 2:** [1-2 sentences with challenge question]

**Scenario 2:**
**Description:** [2-3 sentences explaining the application]
**Challenge Question 1:** [1-2 sentences with challenge question]
**Challenge Question 2:** [1-2 sentences with challenge question]

**Scenario 3:**
**Description:** [2-3 sentences explaining the application]
**Challenge Question 1:** [1-2 sentences with challenge question]
**Challenge Question 2:** [1-2 sentences with challenge question]
    """

    solutions_prompt = f"""
Create COMPREHENSIVE solutions for ALL exercises, quizzes, projects, and scenarios for the topic: **"{topic}"**

{lang_note}

#### ✅ Complete Solutions & Explanations  

**🟢 BEGINNER LEVEL SOLUTIONS**

**Beginner Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Beginner Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Beginner Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Beginner Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**🟡 INTERMEDIATE LEVEL SOLUTIONS**

**Intermediate Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Intermediate Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Intermediate Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Intermediate Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**🔴 ADVANCED LEVEL SOLUTIONS**

**Advanced Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Advanced Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Advanced Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**Advanced Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]

**❓ QUIZ COMPLETE SOLUTIONS**

**Quiz Question 1 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 2 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 3 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 4 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 5 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 6 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 7 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**Quiz Question 8 - Detailed Solution:**
[Provide comprehensive explanation beyond the basic answer, including why other options are incorrect (3-4 sentences)]

**🛠 PROJECT COMPLETE SOLUTIONS**

**Project 1 - Complete Implementation:**
**Step-by-step Solution:**
[Provide detailed implementation steps (5-8 sentences)]
**Code Examples/Pseudo-code:**
[Include relevant code snippets or pseudo-code]
**Testing & Validation:**
[Explain how to test and validate the solution (2-3 sentences)]

**Project 2 - Complete Implementation:**
**Step-by-step Solution:**
[Provide detailed implementation steps (5-8 sentences)]
**Code Examples/Pseudo-code:**
[Include relevant code snippets or pseudo-code]
**Testing & Validation:**
[Explain how to test and validate the solution (2-3 sentences)]

**🌍 SCENARIO COMPLETE SOLUTIONS**

**Scenario 1 Solutions:**
**Challenge Question 1 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]
**Challenge Question 2 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]

**Scenario 2 Solutions:**
**Challenge Question 1 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]
**Challenge Question 2 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]

**Scenario 3 Solutions:**
**Challenge Question 1 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]
**Challenge Question 2 Answer:**
[Provide comprehensive answer with practical application (3-4 sentences)]

**📋 SOLUTION SUMMARY**
[Provide a brief summary of key learning points from all solutions (4-5 sentences)]
    """
    
    chunks = []
    prompts = [exercises_prompt, quiz_prompt, projects_prompt, solutions_prompt]
    
    for prompt in prompts:
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                chunks.append(response.text.strip())
            else:
                chunks.append("## Error\nEmpty response generated")
            time.sleep(3)
        except Exception as e:
            chunks.append(f"## Error\nError generating content: {str(e)}")

    return "\n".join(chunks)


def generate_content_in_chunks_from_professor(topic, professor_content, language="en"):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    references = search_serpapi_links(topic, is_update=False, max_results=10)
    references_text = "\n".join([f"- [{title}]({url})" for title, url in (references or []) if title and url]) or "No external references provided."
    
    lang_note = (
        "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners."
        if language == "vi"
        else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    )

    base_context = f"""
You are a Teaching Assistant Agent creating practice materials for: **"{topic}"**

#### 📜 Professor Knowledge Base  
{professor_content}

#### 🔗 External References  
{references_text}

{lang_note}

IMPORTANT: Base all exercises, questions, and solutions on the Professor Knowledge Base provided above.
    """

    exercises_prompt = base_context + """
Create ONLY the following sections, directly referencing concepts from the Professor Knowledge Base:

#### 🎯 Overview  
- Explain how these materials extend and practice the Professor Knowledge Base concepts (3-5 sentences)
- Specify target learners and alignment with provided knowledge base
- Highlight key concepts from the knowledge base that will be practiced

#### 📚 Progressive Exercises  

**🟢 BEGINNER LEVEL** (Based on fundamental concepts from Knowledge Base)

Exercise 1:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base fundamentals]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Beginner

Exercise 2:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base fundamentals]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Beginner

Exercise 3:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base fundamentals]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Beginner

Exercise 4:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base fundamentals]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Beginner

**🟡 INTERMEDIATE LEVEL** (Based on intermediate concepts from Knowledge Base)

Exercise 1:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Intermediate

Exercise 2:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Intermediate

Exercise 3:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Intermediate

Exercise 4:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Intermediate

**🔴 ADVANCED LEVEL** (Based on advanced concepts from Knowledge Base)

Exercise 1:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies advanced knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Advanced

Exercise 2:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies advanced knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Advanced

Exercise 3:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies advanced knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Advanced

Exercise 4:
**Title:** [Short descriptive title referencing knowledge base concept]
**Task:** [2-3 sentences describing exercise that applies advanced knowledge base concepts]
**Real-world Context:** [1-2 sentences with practical scenario from knowledge base]
**Difficulty:** Advanced
    """

    quiz_prompt = base_context + """
Create ONLY quiz questions directly based on the Professor Knowledge Base:

#### ❓ Quiz Questions (Based on Professor Knowledge Base)

**Question 1:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B] 
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 2:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C] 
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 3:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 4:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 5:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 6:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 7:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]

**Question 8:** [Question directly testing knowledge base concept]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Detailed explanation referencing knowledge base content]
    """

    projects_prompt = base_context + """
Create ONLY projects and scenarios that extend the Professor Knowledge Base:

#### 🛠 Hands-on Projects (Extending Knowledge Base Applications)

**Project 1:**
**Objective:** [Goal that applies knowledge base concepts practically]
**Description:** [Detailed task extending knowledge base applications]
**Expected Output/Result:** [Outcome demonstrating knowledge base mastery]
**Required Tools/Libraries:** [Tools needed, referencing knowledge base if applicable]
**Knowledge Base Connection:** [How this project relates to professor content]

**Project 2:**
**Objective:** [Goal that applies knowledge base concepts practically]
**Description:** [Detailed task extending knowledge base applications]
**Expected Output/Result:** [Outcome demonstrating knowledge base mastery]
**Required Tools/Libraries:** [Tools needed, referencing knowledge base if applicable]
**Knowledge Base Connection:** [How this project relates to professor content]

#### 🌍 Real-world Scenarios (Knowledge Base Applications)

**Scenario 1:**
**Description:** [Real-world application of knowledge base concepts]
**Challenge Question 1:** [Challenge based on knowledge base]
**Challenge Question 2:** [Challenge based on knowledge base]
**Knowledge Base Link:** [Connection to professor content]

**Scenario 2:**
**Description:** [Real-world application of knowledge base concepts]
**Challenge Question 1:** [Challenge based on knowledge base]
**Challenge Question 2:** [Challenge based on knowledge base]
**Knowledge Base Link:** [Connection to professor content]

**Scenario 3:**
**Description:** [Real-world application of knowledge base concepts]
**Challenge Question 1:** [Challenge based on knowledge base]
**Challenge Question 2:** [Challenge based on knowledge base]
**Knowledge Base Link:** [Connection to professor content]
    """

    solutions_prompt = base_context + """
Create COMPREHENSIVE solutions for ALL exercises, quizzes, projects, and scenarios with direct references to the Professor Knowledge Base:

#### ✅ Complete Solutions & Explanations (Referencing Professor Knowledge Base)

**🟢 BEGINNER LEVEL SOLUTIONS**

**Beginner Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Beginner Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Beginner Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Beginner Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**🟡 INTERMEDIATE LEVEL SOLUTIONS**

**Intermediate Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Intermediate Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Intermediate Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Intermediate Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**🔴 ADVANCED LEVEL SOLUTIONS**

**Advanced Exercise 1 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Advanced Exercise 2 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Advanced Exercise 3 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**Advanced Exercise 4 Solution:**
[Provide complete step-by-step solution with detailed reasoning (4-6 sentences)]
**Knowledge Base Reference:** [Cite specific concepts from professor content]

**❓ QUIZ COMPLETE SOLUTIONS**

**Quiz Question 1 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 2 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 3 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 4 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 5 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 6 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 7 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**Quiz Question 8 - Detailed Solution:**
[Comprehensive explanation with knowledge base references (3-4 sentences)]
**Why Other Options Are Wrong:** [Explain incorrect options]

**🛠 PROJECT COMPLETE SOLUTIONS**

**Project 1 - Complete Implementation:**
**Step-by-step Solution:** [Detailed implementation with knowledge base applications]
**Code Examples/Methodology:** [Include relevant examples]
**Knowledge Base Integration:** [How solution applies professor concepts]
**Testing & Validation:** [Validation methods referencing knowledge base]

**Project 2 - Complete Implementation:**
**Step-by-step Solution:** [Detailed implementation with knowledge base applications]
**Code Examples/Methodology:** [Include relevant examples]
**Knowledge Base Integration:** [How solution applies professor concepts]
**Testing & Validation:** [Validation methods referencing knowledge base]

**🌍 SCENARIO COMPLETE SOLUTIONS**

**Scenario 1 Solutions:**
**Challenge Question 1 Answer:** [Comprehensive answer with knowledge base application]
**Challenge Question 2 Answer:** [Comprehensive answer with knowledge base application]

**Scenario 2 Solutions:**
**Challenge Question 1 Answer:** [Comprehensive answer with knowledge base application]
**Challenge Question 2 Answer:** [Comprehensive answer with knowledge base application]

**Scenario 3 Solutions:**
**Challenge Question 1 Answer:** [Comprehensive answer with knowledge base application]
**Challenge Question 2 Answer:** [Comprehensive answer with knowledge base application]

**📋 COMPREHENSIVE SOLUTION SUMMARY**
[Provide detailed summary linking all solutions back to professor knowledge base (5-7 sentences)]
    """

    chunks = []
    prompts = [exercises_prompt, quiz_prompt, projects_prompt, solutions_prompt]
    
    for prompt in prompts:
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                chunks.append(response.text.strip())
            else:
                chunks.append("## Error\nEmpty response generated")
            time.sleep(3)
        except Exception as e:
            chunks.append(f"## Error\nError generating content: {str(e)}")
    
    return "\n".join(chunks)


def generate_assistant_content(topic, language="en"):
    return generate_content_in_chunks(topic, language)


def generate_assistant_from_professor(topic, professor_content, language="en"):
    return generate_content_in_chunks_from_professor(topic, professor_content, language)


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
            
            content = None
            doc_title_prefix = ""
            
            if professor_input:
                if isinstance(professor_input, dict) and "doc_url" in professor_input:
                    doc_url = professor_input["doc_url"]
                    topic = topic or professor_input.get("topic", "")
                    professor_content = extract_text_from_google_doc(doc_url, creds)
                elif isinstance(professor_input, str) and professor_input.startswith("https://docs.google.com/document/"):
                    professor_content = extract_text_from_google_doc(professor_input, creds)
                else:
                    professor_content = professor_input
                
                content = generate_assistant_from_professor(topic, professor_content, language)
                doc_title_prefix = "🎓 Based Practice Materials"
            else:
                content = generate_assistant_content(topic, language)
                doc_title_prefix = "✍️ AI Practice Materials"

            if not content or len(content.strip()) < 100:
                return Response(
                    {"error": "Failed to generate sufficient content. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            doc_title = f"{doc_title_prefix} - {topic}"
            doc_url = create_google_doc(doc_title, content, creds, user.email)
            
            document = api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="assistant",
                language=language,
            )

            return Response({
                "message": "Teaching Assistant content generated successfully with complete solutions.",
                "doc_url": doc_url,
                "document_id": document.id,
                "content_stats": {
                    "length": len(content),
                    "has_solutions": "✅ Complete Solutions" in content,
                    "language": language,
                    "type": "professor-based" if professor_input else "standard"
                }
            }, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                "error": "An error occurred while generating content",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)