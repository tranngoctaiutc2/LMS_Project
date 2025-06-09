import json
import re
import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import google.generativeai as genai
from difflib import get_close_matches
from django.conf import settings
from api.models import UserDocument, ApprovedTopic, Category

genai.configure(api_key=settings.GEMINI_API_KEY)

def normalize_topic(topic: str) -> str:
    return ' '.join(topic.strip().split()).lower()

def get_user_existing_topics(user_id: int) -> list:
    return list(UserDocument.objects.filter(user_id=user_id).values_list('topic', flat=True).distinct())

def get_category_titles() -> list:
    return list(Category.objects.values_list('title', flat=True).distinct())

def is_semantically_related(title: str, reference: str) -> bool:
    title_norm = normalize_topic(title)
    reference_norm = normalize_topic(reference)
    return bool(get_close_matches(title_norm, [reference_norm], n=1, cutoff=0.6))

def generate_topic_suggestions(field: str, existing_topics: list, language: str = "en", original_topic: str = "") -> list:
    category_titles = get_category_titles()
    existing_normalized = [normalize_topic(topic) for topic in existing_topics]
    
    related_titles = []
    for title in category_titles:
        if normalize_topic(title) not in existing_normalized and (
            is_semantically_related(title, field) or is_semantically_related(title, original_topic)
        ):
            related_titles.append(title)
    
    suggestions = []
    
    ai_generated = generate_custom_topic(field, existing_topics)
    suggestions.append(ai_generated)
    
    remaining_slots = 2

    if len(related_titles) >= remaining_slots:
        suggestions.extend(random.sample(related_titles, remaining_slots))
    else:
        suggestions.extend(related_titles)
        needed = remaining_slots - len(related_titles)
        suggestions.extend(generate_custom_topics(field, existing_topics + suggestions, needed))
    
    return suggestions[:3]


def generate_custom_topic(field: str, exclude_topics: list) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    exclude_str = ", ".join(exclude_topics) if exclude_topics else "None"
    
    prompt = f"""
Generate 1 concise academic topic in the field of "{field}".

Exclude these topics: {exclude_str}

Requirements:
- Topic must be in English
- Use 2 to 5 words only
- Use complete and understandable phrases (no abbreviations)
- The topic must be general enough for most learners, not too specialized
- Must still be suitable for academic research or study

Return only the topic name as a plain string (no JSON, no quotes).
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip().replace('"', '')
    except:
        return "Data Science"

def generate_custom_topics(field: str, exclude_topics: list, count: int) -> list:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    exclude_str = ", ".join(exclude_topics) if exclude_topics else "None"
    
    prompt = f"""
Generate {count} concise academic topics in the field of "{field}".

Exclude these topics: {exclude_str}

Requirements:
- Topics must be in English
- Each topic must be 2 to 5 words only
- Use full terms (no abbreviations like AI, NLP, etc.)
- Avoid overly specific or technical phrasing
- Ensure all topics are suitable for academic research

Return only a JSON array of topic strings, for example:
["Data Science", "Machine Learning Applications", "Ethical Technology"]
"""
    try:
        response = model.generate_content(prompt)
        full_text = response.text.strip()
        json_match = re.search(r"\[.*?\]", full_text, re.DOTALL)
        if json_match:
            topics = json.loads(json_match.group(0))
            return topics[:count]
        return []
    except:
        return []

def expand_abbreviation_with_suggestions(abbrev: str, language: str = "en") -> dict:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    prompt = f"""
The user entered an abbreviation: "{abbrev}"

Your task:
1. Expand the abbreviation into its full academic term. You must map it correctly. For example:
   - AI → Artificial Intelligence
   - ML → Machine Learning
   - NLP → Natural Language Processing
2. Provide 3 related academic topic suggestions

Requirements:
- All responses must be in English
- Topics must be complete, full names
- Return JSON format like:
{{
  "expanded": "Artificial Intelligence",
  "suggestions": ["Machine Learning", "Computer Vision", "Natural Language Processing"]
}}
"""


    try:
        response = model.generate_content(prompt)
        full_text = response.text.strip()
        json_match = re.search(r"\{.*?\}", full_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            expanded = result.get("expanded", abbrev)
            suggestions = result.get("suggestions", [])
            
            message = (
                f"Ý của bạn là **{expanded}**? Một số chủ đề gợi ý: {', '.join(suggestions[:3])}"
                if language == "vi"
                else f"Did you mean **{expanded}**? Some suggested topics: {', '.join(suggestions[:3])}"
            )
            
            return {
                "status": "Not Allow",
                "message": message
            }
    except:
        pass
    
    message = (
        "Bạn không được nhập chủ đề viết tắt. Vui lòng nhập chủ đề đầy đủ."
        if language == "vi"
        else "You cannot enter abbreviated topics. Please enter the full topic name."
    )
    
    return {
        "status": "Not Allow", 
        "message": message
    }

def check_topic_with_gemini(topic: str, language: str = "en", user_id: int = None) -> dict:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    lang_note = (
        "Please respond in Vietnamese with a friendly, professional, and helpful tone."
        if language == "vi"
        else "Please respond in English with a friendly, professional, and helpful tone."
    )
    
    existing_topics = get_user_existing_topics(user_id) if user_id else []
    existing_topics_str = ", ".join(existing_topics) if existing_topics else "None"
    
    prompt = f"""
You are an academic assistant evaluating topics for research suitability. Analyze the topic: "{topic}". {lang_note}

User's existing topics: {existing_topics_str}

Follow these steps strictly in order, stopping at the first failure. Always return a valid JSON object with the specified fields.

---

Step 1: Check Academic Suitability
Instructions: Determine if the topic is suitable for academic or scientific study. Suitable fields include Machine Learning, Artificial Intelligence, Computer Science, Education, Psychology, Finance, Ethics, Neuroscience, Gender Studies, Public Health, Media Studies, etc.

Unsuitable topics (strictly prohibited, stop here):
- Pornographic or sexually explicit content (e.g., porn, xxx, hentai, onlyfans, adult videos, fetishes, sex tapes)
- Illegal activities (e.g., drugs like heroin or cocaine, terrorism, weapon sales)
- Hate speech, glorification of violence, self-harm, or exploitation
- Ambiguous or euphemistic sensitive topics (e.g., NSFW fandoms, 420 lifestyle, seductive storytelling)

Output Format (if unsuitable):
{{
  "status": "Not Allow",
  "message": "Chủ đề bạn nhập không phù hợp để nghiên cứu học thuật và bị cấm tuyệt đối." if language == "vi" else
             "The topic you entered is not suitable for academic research and is strictly prohibited."
}}

---

Step 2: Check for Abbreviations
Instructions: Check if the topic is an abbreviation or acronym. Look for:
- Very short terms (1-4 characters) that could be abbreviations
- Common academic abbreviations like: AI, ML, NLP, CNN, RNN, IoT, VR, AR, API, UI, UX, DL, CV, QC, etc.
- Single letters or very short combinations
- Terms that are likely shortened versions of longer academic concepts

If the topic appears to be an abbreviation, STOP HERE and return Not Allow.

Output Format (for abbreviations):
{{
  "status": "Not Allow",
  "message": "abbreviation_detected"
}}

---

Step 3: Detect Language
Instructions: Detect the language of the topic (use ISO 639-1 code, e.g., "en", "vi"). If the topic is not in English:
- Translate the topic to English.
- Suggest 2–4 related academic topics in tech/scientific domains.

Output Format (if not English):
{{
  "status": "Not Allow",
  "message": "Bạn nên nhập chủ đề bằng tiếng Anh. Đây là phiên bản tiếng Anh của chủ đề bạn nhập: Thermal Machine. Một số chủ đề học thuật liên quan: Machine Learning, Artificial Intelligence, Computer Vision." if language == "vi" else
             "You should enter the topic in English. Here is the English version of your topic: Thermal Machine. Some related academic topics: Machine Learning, Artificial Intelligence, Computer Vision."
}}

Stop here if the topic is not in English.

---

Step 4: Check Spelling (English only)
Instructions: Check for spelling mistakes in the topic (English only). If any are found, suggest a corrected topic.

Output Format (if spelling mistake):
{{
  "status": "Not Allow",
  "message": "Phát hiện lỗi chính tả. Chủ đề gợi ý: Machine Learning." if language == "vi" else
             "Spelling mistake detected. Suggested topic: Machine Learning."
}}

---

Step 5: Analyze Academic Context
Instructions: If the topic passes all checks:
- Identify the academic field (in English and Vietnamese).
- Provide a short explanation of the research context.
- Identify at least two suitable complexity levels from: undergraduate, graduate, PhD (e.g., "undergraduate,graduate" in English, "đại học,thạc sĩ" in Vietnamese). Combine levels into a single string with commas.

Output Format:
{{
  "status": "Allow",
  "field_en": "Computer Science",
  "field_vi": "Khoa học máy tính",
  "explanation_en": "This topic falls under Computer Science and is studied in the context of artificial intelligence, machine learning, and data systems.",
  "explanation_vi": "Chủ đề này thuộc lĩnh vực Khoa học máy tính và thường được nghiên cứu trong bối cảnh trí tuệ nhân tạo, học máy và hệ thống dữ liệu.",
  "complexity_en": "undergraduate,graduate",
  "complexity_vi": "đại học,thạc sĩ",
  "message": "Chủ đề phù hợp cho nghiên cứu học thuật. Chủ đề này thuộc lĩnh vực Khoa học máy tính, thường được nghiên cứu trong bối cảnh trí tuệ nhân tạo, học máy và hệ thống dữ liệu, và phù hợp với các trình độ đại học, thạc sĩ." if language == "vi" else
             "Topic is suitable for academic study. This topic falls under Computer Science, is commonly studied in the context of artificial intelligence, machine learning, and data systems, and is suitable for undergraduate, graduate levels."
}}
"""
    try:
        response = model.generate_content(prompt)
        full_text = response.text.strip()
        json_match = re.search(r"\{.*?\}", full_text, re.DOTALL)
        if not json_match:
            return {"status": "Not Allow", "message": "Không tìm thấy JSON." if language == "vi" else "No JSON found."}
        raw_text = json_match.group(0)
        result = json.loads(raw_text)
        if not all(k in result for k in ["status", "message"]):
            raise ValueError("Thiếu trường bắt buộc")
        
        if result.get("message") == "abbreviation_detected":
            return expand_abbreviation_with_suggestions(topic, language)
        
        if result.get("status") == "Allow":
            if not result.get("complexity_en") or not result.get("complexity_vi"):
                result["complexity_en"] = "undergraduate,graduate"
                result["complexity_vi"] = "đại học,thạc sĩ"
            for field in ["complexity_en", "complexity_vi"]:
                levels = result[field].split(",")
                if len(levels) < 2:
                    result[field] = result[field] + ",graduate" if field == "complexity_en" else result[field] + ",thạc sĩ"
        
        return result
    except Exception as e:
        return {
            "status": "Not Allow",
            "message": "Lỗi hệ thống khi kiểm tra chủ đề." if language == "vi" else "System error while checking topic."
        }

class CheckGlobalTopicAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic", "").strip()
        language = request.data.get("language", "en")
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({
                "status": "Error",
                "message": "ID người dùng không hợp lệ." if language == "vi" else "Invalid user ID."
            }, status=status.HTTP_400_BAD_REQUEST)

        normalized = normalize_topic(topic)

        existing_docs = UserDocument.objects.filter(topic__iexact=normalized, user_id=user_id)
        if existing_docs.exists():
            ai_types = existing_docs.values_list("ai_type", flat=True).distinct()
            return Response({
                "status": "Not Allow",
                "message": f"Chủ đề này đã tồn tại ở các loại AI: {', '.join(ai_types)}." if language == "vi" 
                           else f"This topic already exists for AI types: {', '.join(ai_types)}."
            }, status=status.HTTP_400_BAD_REQUEST)

        approved = ApprovedTopic.objects.filter(normalized_topic=normalized).first()
        if approved:
            existing_topics = get_user_existing_topics(user_id)
            suggestions_result = generate_topic_suggestions(approved.field_en, existing_topics, language)
            
            message = (
                f"Chủ đề phù hợp cho nghiên cứu học thuật. {approved.explanation_vi} Phù hợp với các trình độ {approved.complexity_vi}."
                if language == "vi"
                else f"Topic is suitable for academic study. {approved.explanation_en} Suitable for {approved.complexity_en} levels."
            )
            
            response_data = {
                "status": "Allow",
                "message": message
            }
            
            if suggestions_result:
                response_data["suggestions"] = suggestions_result
                
            return Response(response_data, status=status.HTTP_200_OK)

        result = check_topic_with_gemini(topic, language, user_id)
        
        if result.get("status") == "Allow":
            ApprovedTopic.objects.create(
                topic=topic,
                normalized_topic=normalized,
                field_en=result.get("field_en", ""),
                field_vi=result.get("field_vi", ""),
                explanation_en=result.get("explanation_en", ""),
                explanation_vi=result.get("explanation_vi", ""),
                complexity_en=result.get("complexity_en", "undergraduate,graduate"),
                complexity_vi=result.get("complexity_vi", "đại học,thạc sĩ")
            )
            
            existing_topics = get_user_existing_topics(user_id)
            suggestions_result = generate_topic_suggestions(result.get("field_en", ""), existing_topics, language, topic)
            
            response_data = {
                "status": result.get("status", "Not Allow"),
                "message": result.get("message", "Lỗi không xác định." if language == "vi" else "Unknown error.")
            }
            
            if suggestions_result:
                response_data["suggestions"] = suggestions_result
                
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({
                "status": result.get("status", "Not Allow"),
                "message": result.get("message", "Lỗi không xác định." if language == "vi" else "Unknown error.")
            }, status=status.HTTP_400_BAD_REQUEST)