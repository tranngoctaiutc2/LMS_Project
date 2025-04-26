import os
from datetime import datetime
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition
import logging
from django.conf import settings

# Cấu hình logging
logger = logging.getLogger(__name__)

# Lấy thông tin cấu hình từ biến môi trường
GEMINI_API_KEY = settings.GEMINI_API_KEY
QDRANT_API_KEY = settings.QDRANT_API_KEY
QDRANT_URL = settings.QDRANT_URL

# Cấu hình Gemini nếu đủ thông tin
if GEMINI_API_KEY and QDRANT_API_KEY and QDRANT_URL:
    genai.configure(api_key=GEMINI_API_KEY)

    class CustomerSupportAIAgent:
        def __init__(self):
            self.qdrant_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
            )
            self.collection_name = "customer_support"
            self.app_id = "customer-support"

            try:
                self.qdrant_client.get_collection(self.collection_name)
            except Exception:
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=768,
                        distance=Distance.COSINE,
                    ),
                )

            try:
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.embedding_model = genai
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model: {e}")
                raise

        def _generate_embedding(self, text: str):
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document",
                )
                return result['embedding']
            except Exception as e:
                logger.error(f"Embedding generation failed: {e}")
                return None

        def add_memory(self, text: str, user_id: str = None, metadata: dict = {}):
            embedding = self._generate_embedding(text)
            if not embedding:
                return False

            metadata.update({"user_id": user_id, "app_id": self.app_id})
            point = PointStruct(
                id=hash(f"{user_id}_{text}") & ((1 << 63) - 1),
                vector=embedding,
                payload={
                    "text": text,
                    "metadata": metadata,
                    "timestamp": datetime.now().isoformat()
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
                must=[FieldCondition(key="metadata.user_id", match={"value": user_id})]
            ) if user_id else None

            try:
                search_result = self.qdrant_client.search(
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
                    for hit in search_result
                ]
            except Exception as e:
                logger.error(f"Search failed: {e}")
                return None

        def get_all_memories(self, user_id: str = None):
            qdrant_filter = Filter(
                must=[FieldCondition(key="metadata.user_id", match={"value": user_id})]
            ) if user_id else None

            try:
                scroll_result = self.qdrant_client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=qdrant_filter,
                    limit=100,
                    with_payload=True,
                    with_vectors=False
                )
                return [
                    {
                        "text": record.payload["text"],
                        "metadata": record.payload["metadata"],
                        "timestamp": record.payload.get("timestamp")
                    }
                    for record in scroll_result[0]
                ]
            except Exception as e:
                logger.error(f"Scroll failed: {e}")
                return None

        def handle_query(self, query, user_id=None):
            try:
                relevant_memories = self.search_memories(query, user_id)
                context = "Thông tin liên quan từ các cuộc trò chuyện trước:\n"
                if relevant_memories:
                    for memory in relevant_memories:
                        context += f"- {memory['text']}\n"

                full_prompt = f"""{context}
                Khách hàng: {query}
                Hỗ trợ viên:"""

                response = self.model.generate_content([
                    {"role": "user", "parts": [f"Bạn là trợ lý hỗ trợ khách hàng của hệ thống học tập Vdemy. Trả lời chuyên nghiệp và thân thiện.\n\n{full_prompt}"]}
                ])
                answer = response.text

                self.add_memory(query, user_id=user_id, metadata={"role": "user"})
                self.add_memory(answer, user_id=user_id, metadata={"role": "assistant"})

                return answer
            except Exception as e:
                logger.error(f"Failed to handle query: {e}")
                return "Xin lỗi, tôi gặp lỗi. Vui lòng thử lại sau."
            
        def generate_response_only(self, query, history=None):
            try:
                if history:
                    context = "\n".join([
                        f"{msg['role']}: {msg['content']}" for msg in history
                    ])
                else:
                    context = ""

                full_prompt = f"""
                {context}
                Khách hàng: {query}
                Hỗ trợ viên:
                """

                response = self.model.generate_content([
                    {"role": "user", "parts": [f"Bạn là trợ lý hỗ trợ khách hàng của hệ thống học tập Vdemy. Trả lời chuyên nghiệp và thân thiện.\n\n{full_prompt}"]}
                ])
                answer = response.text

                return answer
            except Exception as e:
                logger.error(f"Failed to generate response without memory: {e}")
                return "Xin lỗi, tôi gặp lỗi. Vui lòng thử lại sau."



else:
    raise EnvironmentError("Thiếu GEMINI_API_KEY, QDRANT_API_KEY hoặc QDRANT_URL.")
