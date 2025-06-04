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
import re

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)


def parse_study_duration(study_duration):
    study_duration = study_duration.lower().strip()
    
    match = re.search(r'(\d+)\s*(?:tuần|week)', study_duration)

    total_weeks = int(match.group(1))

    if total_weeks == 2:
        hours_per_week = (25, 30)
        intensity = "very_high"
    elif total_weeks == 4:
        hours_per_week = (15, 20)
        intensity = "high"
    elif total_weeks == 6:
        hours_per_week = (12, 15)
        intensity = "medium_high"
    elif total_weeks == 8:
        hours_per_week = (10, 12)
        intensity = "medium"
    elif total_weeks == 10:
        hours_per_week = (7, 9)
        intensity = "low_medium"
    elif total_weeks == 12:
        hours_per_week = (5, 8)
        intensity = "low"

    avg_hours_per_week = sum(hours_per_week) // 2
    total_hours = total_weeks * avg_hours_per_week

    return {
        "total_weeks": total_weeks,
        "hours_per_week": hours_per_week,
        "total_hours": total_hours,
        "intensity": intensity,
    }



def analyze_professor_content(professor_content):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    prompt = f"""
    Analyze this professor content and extract the following information in JSON format:

    ```
    {{
        "main_topics": ["topic1", "topic2", ...],
        "key_concepts": ["concept1", "concept2", ...],
        "difficulty_levels": {{"basic": ["item1", "item2"], "intermediate": ["item3"], "advanced": ["item4"]}},
        "prerequisites": ["prereq1", "prereq2", ...],
        "practical_applications": ["app1", "app2", ...],
        "recommended_resources": ["resource1", "resource2", ...],
        "estimated_complexity": "low|medium|high",
        "content_depth": "introductory|intermediate|advanced|expert"
    }}
    ```

    Professor Content:
    {professor_content}
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        json_start = response.text.find('{')
        json_end = response.text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            return json.loads(response.text[json_start:json_end])
    except:
        pass
    
    return {
        "main_topics": [],
        "key_concepts": [],
        "difficulty_levels": {"basic": [], "intermediate": [], "advanced": []},
        "prerequisites": [],
        "practical_applications": [],
        "recommended_resources": [],
        "estimated_complexity": "medium",
        "content_depth": "intermediate"
    }


def generate_advisor_content(topic, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    
    duration_info = parse_study_duration(study_duration)
    
    prompt = f"""
You are an expert Academic Advisor creating a comprehensive learning roadmap for: **"{topic}"**

**Study Duration Analysis:**
- Total Duration: {study_duration}
- Total Weeks: {duration_info['total_weeks']}
- Hours per Week: {duration_info['hours_per_week']}
- Total Hours: {duration_info['total_hours']}
- Intensity Level: {duration_info['intensity']}

Create a roadmap that matches this intensity level. For higher intensity (shorter duration), include:
- More focused, essential topics only
- Accelerated learning pace
- More hours of study per week
- Streamlined phases with core concepts

For lower intensity (longer duration), include:
- More comprehensive topic coverage
- Gradual learning pace
- Additional supplementary materials
- Extended practice and review phases

### 📚 Structured Format

#### 🎯 Overview  
- Provide a concise introduction to the topic (3-5 sentences).  
- Explain its importance and why the {duration_info['intensity']} intensity approach is suitable.
- Highlight the roadmap structure for {study_duration}.

#### 📋 Learning Objectives  
- List **6-8 specific objectives** calibrated for {duration_info['total_hours']} total hours of study.
- Ensure objectives match the {duration_info['intensity']} intensity level.

#### 🗺 Roadmap Structure  
- Create **{min(4, max(3, duration_info['total_weeks']//2))} phases** based on duration.
- Each phase should have realistic time allocation for {duration_info['hours_per_week']} hours/week.
- Adjust topic depth based on intensity level.

#### 🕒 Suggested Learning Schedule  
- Weekly breakdown for {duration_info['total_weeks']} weeks
- {duration_info['hours_per_week']} hours per week allocation
- Specific milestones aligned with intensity level

#### 📝 Summary  
- Emphasize how the roadmap optimizes learning for the given time constraints
- Highlight expected proficiency level after {study_duration}

{lang_note}
"""
    return model.generate_content(prompt).text.strip()


def generate_advisor_from_professor(topic, professor_content, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    
    content_analysis = analyze_professor_content(professor_content)
    duration_info = parse_study_duration(study_duration)
    
    prompt = f"""
You are an expert Academic Advisor creating a learning roadmap for: **"{topic}"**

**Professor Knowledge Base Analysis:**
- Main Topics: {content_analysis['main_topics']}
- Key Concepts: {content_analysis['key_concepts']}
- Content Complexity: {content_analysis['estimated_complexity']}
- Content Depth: {content_analysis['content_depth']}

**Study Duration Optimization:**
- Total Duration: {study_duration}
- Total Weeks: {duration_info['total_weeks']}
- Hours per Week: {duration_info['hours_per_week']}
- Total Hours: {duration_info['total_hours']}
- Intensity Level: {duration_info['intensity']}

**Content-Duration Alignment Strategy:**
{get_intensity_strategy(duration_info['intensity'], content_analysis)}

Professor Knowledge Base:
--- BEGIN KNOWLEDGE BASE ---
{professor_content}
--- END KNOWLEDGE BASE ---

**CRITICAL REQUIREMENTS:**
1. **Content Fidelity**: Stick closely to the professor's content structure and topics
2. **Duration Logic**: Shorter duration = more intensive study, fewer but deeper topics
3. **Hour Allocation**: Distribute {duration_info['total_hours']} total hours logically across topics
4. **Progressive Difficulty**: Match content complexity with available time

### 📚 Structured Format

#### 🎯 Overview  
- Introduce the topic based on professor content (3-5 sentences)
- Explain why this {duration_info['intensity']} intensity approach works for this content
- Connect professor expertise to learning pathway

#### 📋 Learning Objectives  
- Extract **6-8 objectives** directly from professor content
- Scale objectives to match {duration_info['total_hours']} hours available
- Prioritize core concepts for shorter durations

#### 🗺 Roadmap Structure  
**CONTENT PRIORITIZATION RULES:**
- **High Intensity ({duration_info['total_weeks']} ≤ 4 weeks)**: Focus on professor's core concepts only
- **Medium Intensity (4-8 weeks)**: Include main topics + some applications  
- **Low Intensity (8+ weeks)**: Comprehensive coverage of all professor content

Create **{calculate_phases(duration_info['total_weeks'])} phases** with:
- Topics extracted directly from professor content
- Time allocation: {duration_info['hours_per_week']} hours/week × {duration_info['total_weeks']} weeks
- Resources prioritizing professor's recommendations

#### 🕒 Suggested Learning Schedule  
**Weekly Schedule for {duration_info['total_weeks']} weeks:**
- **Hours per week**: {duration_info['hours_per_week']}
- **Daily commitment**: {duration_info['hours_per_week']//7 if isinstance(duration_info['hours_per_week'], int) else f"{min(duration_info['hours_per_week'])//7}-{max(duration_info['hours_per_week'])//7}"} hours/day
- Map professor topics to specific weeks
- Include review cycles appropriate for intensity level

#### 📝 Summary  
- Highlight alignment between professor content and time constraints
- Emphasize achievable proficiency level
- Note content coverage percentage based on duration

{lang_note}
"""
    return model.generate_content(prompt).text.strip()


def get_intensity_strategy(intensity, content_analysis):
    strategies = {
        "very_high": f"""
        - **Ultra-Focused Approach**: Cover only the most critical concepts from professor content
        - **Accelerated Learning**: {content_analysis['estimated_complexity']} complexity requires intensive daily commitment
        - **Essential Topics Only**: Prioritize core concepts over comprehensive coverage
        - **Frequent Assessment**: Daily progress checks to maintain pace
        """,
        "high": f"""
        - **Intensive Coverage**: Focus on main topics with practical applications
        - **Streamlined Path**: Cover professor's key concepts efficiently
        - **Active Learning**: Emphasize hands-on practice over theoretical depth
        - **Weekly Milestones**: Clear progress markers every week
        """,
        "medium": f"""
        - **Balanced Approach**: Comprehensive coverage of professor's main topics
        - **Theory + Practice**: Balance conceptual understanding with applications
        - **Flexible Pacing**: Allow time for deeper exploration of complex topics
        - **Bi-weekly Reviews**: Regular assessment and adjustment periods
        """,
        "low_medium": f"""
        - **Thorough Coverage**: Include most professor content with extensions
        - **Deep Learning**: Time for thorough understanding and practice
        - **Supplementary Materials**: Add related topics beyond core content
        - **Monthly Assessments**: Comprehensive review cycles
        """,
        "low": f"""
        - **Comprehensive Mastery**: Complete coverage of all professor content
        - **Expert-Level Depth**: Time for advanced topics and research
        - **Independent Projects**: Extensive practical applications
        - **Flexible Timeline**: Accommodate thorough exploration
        """
    }
    return strategies.get(intensity, strategies["medium"])


def calculate_phases(total_weeks):
    if total_weeks <= 2:
        return 2
    elif total_weeks <= 4:
        return 3
    elif total_weeks <= 8:
        return 4
    elif total_weeks <= 12:
        return 5
    else:
        return 6


def generate_advisor_update(content_summary, study_duration, language="en"):
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    lang_note = "Please write the entire content in Vietnamese, using clear, formal academic language suitable for university-level learners." if language == "vi" else "Please write the entire content in English, using clear, formal academic language suitable for university-level learners."
    
    duration_info = parse_study_duration(study_duration)
    
    prompt = f"""
You are updating a learning roadmap with new study duration: **{study_duration}**

**New Duration Analysis:**
- Total Weeks: {duration_info['total_weeks']}
- Hours per Week: {duration_info['hours_per_week']}
- Total Hours: {duration_info['total_hours']}
- New Intensity: {duration_info['intensity']}

**Content Adjustment Rules:**
- **Shorter Duration**: Increase intensity, focus on core topics, more hours/week
- **Longer Duration**: Reduce intensity, add supplementary content, fewer hours/week
- **Maintain Content Quality**: Preserve learning objectives while adjusting pace

Current Roadmap Summary:
--- BEGIN SUMMARY ---
{content_summary}
--- END SUMMARY ---

**CRITICAL UPDATES NEEDED:**
1. **Recalculate Schedule**: Redistribute content across {duration_info['total_weeks']} weeks
2. **Adjust Intensity**: Match new {duration_info['intensity']} intensity level
3. **Rebalance Hours**: {duration_info['hours_per_week']} hours per week allocation
4. **Update Milestones**: Align checkpoints with new timeline

#### 🕒 Updated Suggested Learning Schedule  
**New Schedule for {duration_info['total_weeks']} weeks:**
- **Intensity Level**: {duration_info['intensity']}
- **Hours per Week**: {duration_info['hours_per_week']}
- **Total Commitment**: {duration_info['total_hours']} hours

[Provide detailed weekly breakdown matching new intensity]

#### 📝 Updated Summary  
- Compare old vs new approach
- Highlight intensity changes and their impact
- Emphasize adapted learning outcomes

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
                    
                    old_duration_info = parse_study_duration(old_duration) if old_duration else None
                    new_duration_info = parse_study_duration(study_duration)
                    
                    if (old_duration_info and 
                        old_duration_info['total_weeks'] == new_duration_info['total_weeks'] and
                        old_duration_info['intensity'] == new_duration_info['intensity']):
                        return Response({
                            "error": "New study_duration is too similar to existing one. Please choose a significantly different duration."
                        }, status=400)
                        
                except api_models.UserDocument.DoesNotExist:
                    old_duration = ""

                update_text = generate_advisor_update(existing_content, study_duration, language)
                update_google_doc(doc_url, update_text, creds)

                existing_doc.study_duration = study_duration
                existing_doc.save()

                duration_info = new_duration_info

                return Response({
                    "message": "Document updated with new study duration.",
                    "doc_url": doc_url,
                    "duration_info": duration_info
                })

            # Tính duration_info trước khi tạo nội dung mới
            duration_info = parse_study_duration(study_duration)

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
                content = generate_advisor_content(topic, study_duration, language)

            doc_title = f"🗺️ Learning Roadmap - {topic}"
            doc_url = create_google_doc(doc_title, content, creds, user.email)

            api_models.UserDocument.objects.create(
                user=user,
                topic=topic,
                doc_url=doc_url,
                ai_type="advisor",
                language=language,
                study_duration=study_duration
            )

            return Response({
                "message": "Document created successfully",
                "doc_url": doc_url,
                "duration_info": duration_info,
                "content_preview": content[:200] + "..." if len(content) > 200 else content
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            return Response({"error": f"Internal server error: {str(e)}"}, status=500)