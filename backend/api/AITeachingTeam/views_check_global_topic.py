import json
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import google.generativeai as genai
from django.conf import settings
from api.models import UserDocument, ApprovedTopic

genai.configure(api_key=settings.GEMINI_API_KEY)

def normalize_topic(topic: str) -> str:
    return ' '.join(topic.strip().split()).lower()

def check_topic_with_gemini(topic: str, language: str = "en") -> dict:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    lang_note = (
        "Please respond in Vietnamese with a friendly, professional, and helpful tone."
        if language == "vi"
        else "Please respond in English with a friendly, professional, and helpful tone."
    )
    prompt = f"""
You are an academic assistant evaluating topics for research suitability. Analyze the topic: "{topic}". {lang_note}

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

Step 2: Detect Language
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

Step 3: Check Spelling (English only)
Instructions: Check for spelling mistakes in the topic (English only). If any are found, suggest a corrected topic.

Output Format (if spelling mistake):
{{
  "status": "Not Allow",
  "message": "Phát hiện lỗi chính tả. Chủ đề gợi ý: Machine Learning." if language == "vi" else
             "Spelling mistake detected. Suggested topic: Machine Learning."
}}

---

Step 4: Analyze Academic Context and Complexity
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
            message = (
                f"Chủ đề phù hợp cho nghiên cứu học thuật. {approved.explanation_vi} Phù hợp với các trình độ {approved.complexity_vi}."
                if language == "vi"
                else f"Topic is suitable for academic study. {approved.explanation_en} Suitable for {approved.complexity_en} levels."
            )
            return Response({
                "status": "Allow",
                "message": message
            }, status=status.HTTP_200_OK)

        result = check_topic_with_gemini(topic, language)
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
        return Response({
            "status": result.get("status", "Not Allow"),
            "message": result.get("message", "Lỗi không xác định." if language == "vi" else "Unknown error.")
        }, status=status.HTTP_200_OK if result.get("status") == "Allow" else status.HTTP_400_BAD_REQUEST)