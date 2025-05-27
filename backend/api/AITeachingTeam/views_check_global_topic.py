import json
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import google.generativeai as genai
from django.conf import settings
from api.models import UserDocument

# Cấu hình Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

def normalize_topic(topic: str) -> str:
    """Chuẩn hóa topic: loại bỏ khoảng trắng thừa, chuyển về chữ thường."""
    return ' '.join(topic.strip().split()).lower()

def check_topic_with_gemini(topic: str, language: str = "en") -> dict:
    model = genai.GenerativeModel("gemini-2.0-flash")

    lang_note = (
        "Please respond in Vietnamese in a friendly and helpful tone."
        if language == "vi"
        else "Please respond in English in a friendly and helpful tone."
    )

    prompt = f"""
You are an assistant helping users evaluate academic topics. Analyze the topic: "{topic}". {lang_note}

You must perform the following steps in order, and stop at the first failure. Always return a valid JSON object with fields: "status" and "message". Embed all values directly — do not return markdown or placeholders.

---

1. Determine if the topic is suitable for academic or scientific study.

✅ Suitable topics:
- Fields such as: Machine Learning, Artificial Intelligence, Computer Science, Education, Psychology, Finance, Ethics, Neuroscience, Gender Studies, Public Health, Media Studies, etc.

---

❌ Unsuitable topics fall into two categories:

### A. Strictly Prohibited Topics (reject immediately without suggestion):
These include:
- Pornographic or sexually explicit content (e.g., porn, xxx, hentai, onlyfans, adult videos, fetishes, sex tapes)
- Illegal activity (e.g., drugs like heroin or cocaine, terrorism, weapon sales)
- Hate speech, glorification of violence, self-harm, or exploitation

If the topic falls into this category, you MUST return the following JSON response:

{{
  "status": "Not Allow",
  "message": "Chủ đề bạn nhập không phù hợp để nghiên cứu học thuật và bị cấm tuyệt đối." if language == "vi" else
             "The topic you entered is not suitable for academic research and is strictly prohibited."
}}

Do NOT suggest any alternative topics. Do NOT proceed to the next step.

---

⚠️ B. Ambiguous or borderline topics (reject, but suggest appropriate alternatives):

These include:
- Vague or euphemistic references to adult, risky, or sensitive content (e.g., "NSFW fandoms", "intimate storytelling", "420 lifestyle")
- Topics that imply potentially inappropriate behavior without being explicitly illegal

If the topic falls into this category:

1. Reject the topic by setting "status": "Not Allow".

2. You MUST suggest 2–3 academic topics, following these rules:
   - ✅ At least ONE topic must be semantically inferred from the original topic. It should be created based on your understanding of the meaning of the input. Do NOT choose this from a predefined list.
   - ✅ You may include UP TO TWO additional academic topics selected from general safe fields (e.g., Sociology, Ethics, Media Studies).
   - ❌ Do NOT repeat topics with overlapping meanings (e.g., both "Sociology" and "Social Sciences").
   - ✅ Ensure semantic variety across suggestions.

3. If language == "vi", translate each topic into Vietnamese and format them like:
   - "Machine Learning (Học máy)", "Media Studies (Nghiên cứu truyền thông)"

4. Return the result in the following format:

{{
  "status": "Not Allow",
  "message": "Bạn nên chọn chủ đề phù hợp cho học thuật. Gợi ý: Online Fan Culture (Văn hóa người hâm mộ trực tuyến), Media Psychology (Tâm lý học truyền thông), Sociology (Xã hội học)." if language == "vi" else
             "You should choose a topic suitable for academic study. Suggested topics: Online Fan Culture, Media Psychology, Sociology."
}}

Stop and do not proceed to the next step.
---

2. Detect the language of the topic (use ISO 639-1 code, e.g., "en", "vi").

- If the topic is in English ("en"), continue to the next step.

- If the topic is NOT in English (e.g., "vi", "fr", etc.):
  - Translate or interpret the topic into English (e.g., "hót máy" → "Thermal Machine").
  - Suggest 2–4 related academic topics, prioritizing fields in technology (e.g., "Machine Learning", "Artificial Intelligence", "Computer Vision", etc.).

Then return:

{{
  "status": "Not Allow",
  "message": "Bạn nên nhập chủ đề bằng tiếng Anh. Đây là phiên bản tiếng Anh của chủ đề bạn nhập: Thermal Machine. Một số chủ đề học thuật liên quan: Machine Learning, Artificial Intelligence, Computer Vision." if language == "vi" else
             "You should enter the topic in English. Here is the English version of your topic: Thermal Machine. Some related academic topics: Machine Learning, Artificial Intelligence, Computer Vision."
}}

⛔ Do not proceed to the next step if the topic is not in English.

---

3. Check for spelling mistakes (only if topic is in English).

- If a misspelling is detected, suggest the corrected topic (e.g., "Mashine Learning" → "Machine Learning") and return:

{{
  "status": "Not Allow",
  "message": "Phát hiện lỗi chính tả. Chủ đề gợi ý: Machine Learning." if language == "vi" else
             "Spelling mistake detected. Suggested topic: Machine Learning."
}}

---

4. If all checks pass:

- Determine the academic field the topic belongs to (e.g., "Computer Science", "Psychology", etc.).
- Briefly explain the typical context in which the topic is studied.

Then return:

{{
  "status": "Allow",
  "message": "Chủ đề phù hợp cho nghiên cứu học thuật. Chủ đề này thuộc lĩnh vực Computer Science và thường được nghiên cứu trong bối cảnh trí tuệ nhân tạo, học máy, và khai thác dữ liệu." if language == "vi" else
             "Topic is suitable for academic study. This topic falls under Computer Science and is commonly studied in the context of artificial intelligence, machine learning, and data mining."
}}

---

**Important Notes**:
- Only return JSON.
- Do not use markdown formatting (e.g., ```json).
- Do not use placeholder tokens like [x]. Embed all values directly.
- All suggested topics must be in English, even if the message is in Vietnamese.
"""


    try:
        response = model.generate_content(prompt)

        # In phản hồi thô để debug
        print(f"[Gemini raw response for topic '{topic}']:\n{response.text}")

        full_text = response.text.strip()

        # Dùng regex để tìm đoạn JSON đầu tiên trong chuỗi
        json_match = re.search(r"\{.*?\}", full_text, re.DOTALL)

        if not json_match:
            print(f"[Gemini] Không tìm thấy JSON hợp lệ trong phản hồi:\n{full_text}")
            return {
                "status": "Not Allow",
                "message": "Lỗi hệ thống: Không tìm thấy dữ liệu JSON từ Gemini." if language == "vi"
                        else "System error: No valid JSON response from Gemini."
            }

        raw_text = json_match.group(0)

        result = json.loads(raw_text)

        # Kiểm tra các trường bắt buộc
        if not all(key in result for key in ["status", "message"]):
            raise ValueError("Response missing required fields")

        return result

    except ValueError as e:
        print(f"[Gemini] Invalid format for topic '{topic}': {e}")
        return {
            "status": "Not Allow",
            "message": "Lỗi định dạng phản hồi từ hệ thống." if language == "vi"
                    else "Invalid response format from system."
        }

    except Exception as e:
        print(f"[Gemini] Unhandled exception for topic '{topic}': {e}")
        return {
            "status": "Not Allow",
            "message": "Lỗi hệ thống khi kiểm tra chủ đề." if language == "vi"
                    else "System error while checking topic."
        }


class CheckGlobalTopicAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Lấy topic và language từ request
        topic = request.data.get("topic", "").strip()
        language = request.data.get("language", "en")

        # Kiểm tra trùng lặp
        normalized_topic = normalize_topic(topic)
        if UserDocument.objects.filter(topic__iexact=normalized_topic).exists():
            return Response({
                "status": "Not Allow",
                "message": "Chủ đề này đã tồn tại." if language == "vi" else "This topic already exists."
            }, status=status.HTTP_200_OK)

        # Gọi Gemini để kiểm tra
        result = check_topic_with_gemini(topic, language)

        # Trả về kết quả từ Gemini
        return Response({
            "status": result.get("status", "Not Allow"),
            "message": result.get("message", "Lỗi không xác định." if language == "vi" else "Unknown error.")
        }, status=status.HTTP_200_OK)