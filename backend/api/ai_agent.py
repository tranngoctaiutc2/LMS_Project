import os
import uuid
from datetime import datetime
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import logging
from django.conf import settings
from langdetect import detect
from api import models as api_models

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

class CustomerSupportAIAgent:
    def __init__(self):
        self.collection_name = "customer_support"
        self.app_id = "customer-support"
        self.qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.embedding_model = genai
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        try:
            self.qdrant_client.get_collection(self.collection_name)
        except Exception:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )

    def _generate_embedding(self, text: str):
        try:
            result = self.embedding_model.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document",
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None

    def _detect_language(self, text: str):
        try:
            return detect(text)
        except Exception:
            return "en"

    def add_memory(self, text: str, user_id: str = None, metadata: dict = None):
        metadata = metadata or {}
        embedding = self._generate_embedding(text)
        if not embedding:
            return False
        metadata.update({"user_id": user_id, "app_id": self.app_id})
        point = PointStruct(
            id=int(uuid.uuid4().int >> 64),
            vector=embedding,
            payload={
                "text": text,
                "metadata": metadata,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        try:
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=[point],
            )
            return True
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
            return False

    def search_memories(self, query: str, user_id: str = None, limit: int = 3):
        query_embedding = self._generate_embedding(query)
        if not query_embedding:
            return None
        qdrant_filter = Filter(
            must=[FieldCondition(key="metadata.user_id", match=MatchValue(value=user_id))]
        ) if user_id else None
        try:
            results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=qdrant_filter,
                limit=limit
            )
            return [
                {
                    "text": hit.payload["text"],
                    "metadata": hit.payload["metadata"],
                    "score": hit.score
                }
                for hit in results
            ]
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return None

    def get_all_memories(self, user_id: str = None):
        if not user_id:
            return []
        try:
            scroll_result = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(must=[FieldCondition(key="metadata.user_id", match=MatchValue(value=user_id))]),
                limit=100,
                with_payload=True,
                with_vectors=False
            )
            return [
                {
                    "text": r.payload["text"],
                    "metadata": r.payload["metadata"],
                    "timestamp": r.payload.get("timestamp")
                }
                for r in scroll_result[0]
            ]
        except Exception as e:
            logger.error(f"Failed to get memories: {e}")
            return []

    def delete_memories(self, user_id: str):
        try:
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[FieldCondition(key="metadata.user_id", match=MatchValue(value=user_id))]
                )
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete memories for user {user_id}: {e}")
            return False

    def is_course_recommendation_query(self, query: str):
        keywords = [
            "gợi ý khóa học", "khóa học nào", "nên học gì",
            "học gì", "khóa học phù hợp", "course recommendation"
        ]
        simple_course_words = ["khoá học", "khóa học", "course"]  # Thêm từ khóa đơn giản
        query_lower = query.lower()

        if any(k in query_lower for k in keywords):
            return True
        # Nếu chỉ hỏi đơn giản về "khoá học" thì cũng trả True
        if any(word == query_lower.strip() for word in simple_course_words):
            return True
        return False


    def recommend_courses(self, user_id: str, limit: int = 5, single: bool = False):
        try:
            courses_qs = api_models.Course.objects.all()[:limit]
            if not courses_qs.exists():
                logger.warning("No published courses found in DB for recommendation.")
                return []

            if single:
                c = courses_qs.first()
                if c:
                    return [{
                        "title": c.title,
                        "description": c.description,
                        "level": c.level,
                        "slug": c.slug,
                    }]
                else:
                    return []
            else:
                courses_list = []
                for c in courses_qs[:limit]:
                    courses_list.append({
                        "title": c.title,
                        "description": c.description,
                        "level": c.level,
                        "slug": c.slug,
                    })
                logger.info(f"Recommend {len(courses_list)} courses for user {user_id}")
                return courses_list

        except Exception as e:
            logger.error(f"Failed to fetch course recommendations: {e}")
            return []



    def _build_prompt(self, query, memories=None, lang="en", course_suggestions=None):
        lang_instruction = {
            "vi": "Bạn là một trợ lý hỗ trợ khách hàng chuyên nghiệp và thân thiện cho hệ thống học tập Vdemy. Luôn trả lời bằng tiếng Việt.",
            "en": "You are a professional, friendly customer support assistant for the Vdemy learning system. Always reply in English.",
        }.get(lang, "You are a professional, friendly customer support assistant for the Vdemy learning system. Always reply in the user's language.")

        context = ""
        if memories:
            context += "Relevant past messages:\n" + "\n".join([f"- {m['text']}" for m in memories])

        if course_suggestions:
            course_list = "\n".join(
                [f"- {c['title']} ({c['level']}): {c['description']}" for c in course_suggestions]
            )
            context += f"\n\nSuggested courses for the user:\n{course_list}"

        return f"""{lang_instruction}

        {context}

        Customer: {query}
        Support:"""

    def handle_query(self, query: str, user_id: str):
        lang = self._detect_language(query)
        try:
            if self.is_course_recommendation_query(query):
                memories = self.get_all_memories(user_id)
                keywords = ["lập trình", "python", "thiết kế", "beginner", "nâng cao", "marketing", "data", "ai", "machine learning"]
                has_detail = any(
                    any(k in m["text"].lower() for k in keywords)
                    for m in memories
                )

                simple_course_words = ["khoá học", "khóa học", "course"]
                if query.strip().lower() in simple_course_words:
                    course_suggestions = self.recommend_courses(user_id, single=True)
                else:
                    course_suggestions = self.recommend_courses(user_id)

                # Nếu chưa có detail, vẫn trả về khóa học + hỏi thêm
                if not has_detail:
                    followup = {
                        "vi": "Dưới đây là một số khóa học nổi bật dành cho bạn. Bạn có muốn tìm theo chủ đề hoặc trình độ cụ thể không?",
                        "en": "Here are some popular courses for you. Would you like to search by a specific topic or level?"
                    }.get(lang, "Here are some popular courses. Would you like to search by a specific topic or level?")

                    self.add_memory(query, user_id=user_id, metadata={"role": "user", "lang": lang})
                    self.add_memory(followup, user_id=user_id, metadata={"role": "assistant", "lang": lang})

                    # Tạo prompt với khóa học gợi ý
                    prompt = self._build_prompt(query, memories, lang, course_suggestions)
                    response = self.model.generate_content([
                        {"role": "user", "parts": [prompt]}
                    ])

                    # Trả về câu trả lời có chứa khóa học + thêm câu hỏi follow-up
                    return f"{response.text}\n\n{followup}"

                # Nếu đã có detail rồi thì trả lời bình thường, kèm khóa học
                prompt = self._build_prompt(query, memories, lang, course_suggestions)

            else:
                memories = self.search_memories(query, user_id)
                prompt = self._build_prompt(query, memories, lang)

            response = self.model.generate_content([
                {"role": "user", "parts": [prompt]}
            ])
            answer = response.text
            self.add_memory(query, user_id=user_id, metadata={"role": "user", "lang": lang})
            self.add_memory(answer, user_id=user_id, metadata={"role": "assistant", "lang": lang})
            return answer
        except Exception as e:
            logger.error(f"Failed to handle query: {e}")
            return {
                "vi": "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                "en": "Sorry, something went wrong. Please try again later."
            }.get(lang, "Sorry, something went wrong. Please try again later.")




    def generate_response_only(self, query: str, history=None):
        lang = self._detect_language(query)
        context = "\n".join([f"{m['role']}: {m['content']}" for m in history]) if history else ""
        prompt = self._build_prompt(query, [{"text": context}], lang) if context else self._build_prompt(query, None, lang)
        try:
            response = self.model.generate_content([
                {"role": "user", "parts": [prompt]}
            ])
            return response.text
        except Exception as e:
            logger.error(f"Failed to generate response only: {e}")
            return {
                "vi": "Xin lỗi, đã có lỗi xảy ra.",
                "en": "Sorry, something went wrong."
            }.get(lang, "Sorry, something went wrong.")
