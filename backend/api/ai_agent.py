import os
import uuid
import random
import json
from datetime import datetime
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import logging
from django.conf import settings
from api import models as api_models
import re
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)

@dataclass
class UserProfile:
    user_id: str
    skill_level: str = "beginner"
    preferred_topics: List[str] = field(default_factory=list)
    learning_history: List[str] = field(default_factory=list)
    interaction_count: int = 0
    satisfaction_score: float = 0.0
    last_interaction: str = None

@dataclass
class ConversationContext:
    current_intent: str
    entities: Dict[str, str]
    conversation_state: str
    previous_intents: List[str]
    context_score: float

@dataclass
class CourseRecommendation:
    course_id: str
    title: str
    description: str
    level: str
    slug: str
    relevance_score: float
    content_score: float
    collaborative_score: float
    trending_score: float
    final_score: float

class CustomerSupportAIAgent:
    def __init__(self):
        self.collection_name = "customer_support_v2"
        self.app_id = "customer-support-enhanced"
        self.qdrant_client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
        self.embedding_model = genai
        self._ensure_collection_exists()
        self.user_profiles = {}
        self.intent_threshold = 0.7
        self.response_templates = {
            "basic_web": {
                "vi": "Để truy cập các tính năng web của Vdemy:\n1. 🔗 Truy cập: /home\n2. 📧 Đăng nhập hoặc đăng ký\n3. 🚀 Khám phá các khóa học và tính năng\n\n💡 Cần hỗ trợ thêm? Tôi sẵn sàng giúp bạn!",
                "en": "To access Vdemy's web features:\n1. 🔗 Visit: /home\n2. 📧 Log in or register\n3. 🚀 Explore courses and features\n\n💡 Need more help? I'm here to assist you!"
            }
        }

    def _ensure_collection_exists(self):
        try:
            self.qdrant_client.get_collection(self.collection_name)
        except Exception:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )

    def _generate_embedding(self, text: str) -> Optional[List[float]]:
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

    def _detect_language_and_intent_with_llm(self, query: str, context: Optional[str] = None) -> Tuple[str, str, float, Dict]:
        prompt = f"""Analyze this query and return valid JSON only:
Query: "{query}"
Context: {context or "No context"}

Return exactly:
{{
    "language": "vi" or "en",
    "intent": "basic_web|course_recommend|general_inquiry",
    "confidence": 0.0-1.0,
    "entities": {{
        "course_topic": "topic if any",
        "skill_level": "beginner|intermediate|advanced",
        "specific_course": "course name if mentioned",
        "urgency": "low|medium|high",
        "sentiment": "positive|neutral|negative",
        "web_feature": "login|register|navigation|payment|other"
    }}
}}"""
        try:
            response = self.model.generate_content([{"role": "user", "parts": [prompt]}])
            result = json.loads(response.text.strip())
            return (
                result.get("language", "en"),
                result.get("intent", "general_inquiry"),
                result.get("confidence", 0.5),
                result.get("entities", {})
            )
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            return self._fallback_detection(query)

    def _fallback_detection(self, query: str) -> Tuple[str, str, float, Dict]:
        vietnamese_chars = len(re.findall(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', query.lower()))
        language = "vi" if vietnamese_chars > 0 else "en"
        
        intent = "general_inquiry"
        entities = {}
        if any(word in query.lower() for word in ["login", "đăng nhập", "log in", "register", "đăng ký", "sign up", "payment", "thanh toán", "navigate"]):
            intent = "basic_web"
            entities["web_feature"] = "login" if "login" in query.lower() or "đăng nhập" in query.lower() else \
                                    "register" if "register" in query.lower() or "đăng ký" in query.lower() else \
                                    "payment" if "payment" in query.lower() or "thanh toán" in query.lower() else "navigation"
        elif any(word in query.lower() for word in ["course", "khóa học", "học", "learn"]):
            intent = "course_recommend"
        
        return language, intent, 0.6, entities

    def get_or_create_user_profile(self, user_id: str) -> UserProfile:
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile(user_id=user_id)
        return self.user_profiles[user_id]

    def update_user_profile(self, user_id: str, entities: Dict, intent: str):
        profile = self.get_or_create_user_profile(user_id)
        profile.interaction_count += 1
        profile.last_interaction = datetime.utcnow().isoformat()
        
        if entities.get("skill_level"):
            profile.skill_level = entities["skill_level"]
        
        if entities.get("course_topic"):
            topic = entities["course_topic"]
            if topic not in profile.preferred_topics:
                profile.preferred_topics.append(topic)

    def _build_context(self, user_id: str, current_intent: str, entities: Dict) -> ConversationContext:
        profile = self.get_or_create_user_profile(user_id)
        recent_memories = self.search_memories(f"user {user_id}", user_id, limit=5)
        previous_intents = [mem.get("metadata", {}).get("action_intent") 
                          for mem in (recent_memories or []) 
                          if mem.get("metadata", {}).get("action_intent")]
        
        context_score = self._calculate_context_score(current_intent, previous_intents)
        
        return ConversationContext(
            current_intent=current_intent,
            entities=entities,
            conversation_state="active",
            previous_intents=previous_intents[-3:],
            context_score=context_score
        )

    def _calculate_context_score(self, current_intent: str, previous_intents: List[str]) -> float:
        if not previous_intents:
            return 0.5
        
        flow_patterns = {
            "basic_web": ["general_inquiry", "course_recommend"],
            "course_recommend": ["basic_web", "general_inquiry"],
            "general_inquiry": ["basic_web", "course_recommend"]
        }
        
        expected_flows = flow_patterns.get(current_intent, [])
        recent_intent = previous_intents[-1] if previous_intents else ""
        
        if recent_intent in expected_flows:
            return 0.9
        elif any(intent in expected_flows for intent in previous_intents[-2:]):
            return 0.7
        else:
            return 0.3

    def _handle_basic_web(self, language: str, entities: Dict) -> Dict:
        prompt = f"""Generate JSON response for web-related query in {language}:
Entities: {entities}

Return:
{{
    "web_feature": "login|register|navigation|payment|other",
    "instructions": "step-by-step guide",
    "url": "relevant url",
    "additional_info": "extra details if needed"
}}"""
        try:
            response = self.model.generate_content([{"role": "user", "parts": [prompt]}])
            return json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Basic web handling failed: {e}")
            return {
                "web_feature": entities.get("web_feature", "other"),
                "instructions": self.response_templates["basic_web"].get(language),
                "url": "/home",
                "additional_info": "Please contact support for further assistance."
            }

    def _handle_course_recommendation(self, query: str, language: str, entities: Dict, user_profile: UserProfile, limit: int = 5) -> Tuple[str, List[CourseRecommendation]]:
        prompt = f"""Analyze course recommendation query in {language}:
Query: {query}
Entities: {entities}
User Profile: {user_profile.skill_level}, Topics: {user_profile.preferred_topics}

If more information is needed, return:
{{
    "needs_more_info": true,
    "questions": ["question1", "question2"]
}}

Otherwise, return:
{{
    "needs_more_info": false,
    "recommendations": []
}}"""
        try:
            response = self.model.generate_content([{"role": "user", "parts": [prompt]}])
            result = json.loads(response.text.strip())
            
            if result.get("needs_more_info"):
                return "\n".join(result["questions"]), []
            
            recommendations = self._advanced_course_recommendation(query, entities, user_profile, limit)
            return "Here are your recommended courses:", recommendations
            
        except Exception as e:
            logger.error(f"Course recommendation handling failed: {e}")
            return "Could you specify which topic or level you're interested in?", []

    def _advanced_course_recommendation(self, query: str, entities: Dict, user_profile: UserProfile, limit: int = 5) -> List[CourseRecommendation]:
        try:
            courses = list(api_models.Course.objects.all())
            if not courses:
                return []
            
            query_embedding = self._generate_embedding(query)
            if not query_embedding:
                return []
            
            recommendations = []
            
            for course in courses:
                content_score = self._calculate_content_score(query_embedding, course, entities)
                collaborative_score = self._calculate_collaborative_score(course, user_profile)
                trending_score = random.uniform(0.3, 0.9)
                learning_path_score = self._calculate_learning_path_score(course, user_profile)
                
                final_score = (content_score * 0.4 + collaborative_score * 0.3 + 
                             trending_score * 0.2 + learning_path_score * 0.1)
                
                recommendations.append(CourseRecommendation(
                    course_id=str(course.id), title=course.title, description=course.description,
                    level=course.level, slug=course.slug, relevance_score=content_score,
                    content_score=content_score, collaborative_score=collaborative_score,
                    trending_score=trending_score, final_score=final_score
                ))
            
            recommendations.sort(key=lambda x: x.final_score, reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Course recommendation failed: {e}")
            return []

    def _calculate_content_score(self, query_embedding: List[float], course, entities: Dict) -> float:
        try:
            course_text = f"{course.title} {course.description} {course.level}"
            course_embedding = self._generate_embedding(course_text)
            
            if not course_embedding:
                return 0.0
            
            similarity = cosine_similarity([query_embedding], [course_embedding])[0][0]
            
            requested_level = (entities.get("skill_level") or "").lower()
            if requested_level and course.level.lower() == requested_level:
                similarity += 0.2
            
            topic = (entities.get("course_topic") or "").lower()
            if topic and (topic in course.title.lower() or topic in course.description.lower()):
                similarity += 0.15
            
            return min(similarity, 1.0)
            
        except Exception as e:
            logger.error(f"Content score calculation failed: {e}")
            return 0.0

    def _calculate_collaborative_score(self, course, user_profile: UserProfile) -> float:
        base_score = 0.5
        
        for topic in user_profile.preferred_topics:
            if topic.lower() in course.title.lower() or topic.lower() in course.description.lower():
                base_score += 0.1
        
        engagement_bonus = min(user_profile.interaction_count * 0.02, 0.3)
        return min(base_score + engagement_bonus, 1.0)

    def _calculate_learning_path_score(self, course, user_profile: UserProfile) -> float:
        base_score = 0.5
        user_level = user_profile.skill_level.lower()
        course_level = course.level.lower()
        
        if user_level == course_level:
            base_score += 0.3
        elif (user_level == "beginner" and course_level == "intermediate") or \
             (user_level == "intermediate" and course_level == "advanced"):
            base_score += 0.2
        
        return base_score

    def _handle_general_inquiry(self, query: str, language: str, entities: Dict, context: ConversationContext, user_profile: UserProfile) -> str:
        prompt = f"""Generate friendly response for general inquiry in {language}:
Query: {query}
Context: {context.current_intent}, Previous: {context.previous_intents}
User: {user_profile.skill_level}, Topics: {user_profile.preferred_topics}
Entities: {entities}

Be professional, use emojis, provide helpful information."""
        try:
            response = self.model.generate_content([{"role": "user", "parts": [prompt]}])
            return response.text.strip()
        except Exception as e:
            logger.error(f"General inquiry handling failed: {e}")
            return "I'm here to help you. Please let me know what you need assistance with."

    def add_memory(self, text: str, user_id: str = None, metadata: dict = None):
        metadata = metadata or {}
        embedding = self._generate_embedding(text)
        if not embedding:
            return False
            
        metadata.update({
            "user_id": user_id, 
            "app_id": self.app_id,
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": metadata.get("session_id", str(uuid.uuid4()))
        })
        
        point = PointStruct(
            id=int(uuid.uuid4().int >> 64),
            vector=embedding,
            payload={"text": text, "metadata": metadata, "timestamp": datetime.utcnow().isoformat()}
        )
        
        try:
            self.qdrant_client.upsert(collection_name=self.collection_name, points=[point])
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
            return [{
                "text": hit.payload["text"],
                "metadata": hit.payload["metadata"],
                "score": hit.score,
                "timestamp": hit.payload.get("timestamp")
            } for hit in results]
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return None

    def handle_query(self, query: str, user_id: str, session_id: str = None) -> Dict:
        try:
            recent_context = self.search_memories(query, user_id, limit=3)
            context_text = " ".join([mem["text"] for mem in (recent_context or [])[-2:]])
            
            language, intent, confidence, entities = self._detect_language_and_intent_with_llm(query, context_text)
            
            user_profile = self.get_or_create_user_profile(user_id)
            self.update_user_profile(user_id, entities, intent)
            
            context = self._build_context(user_id, intent, entities)
            
            response_data = {"response": "", "language": language, "intent": intent, 
                           "confidence": confidence, "entities": entities, 
                           "recommendations": [], "context_score": context.context_score,
                           "user_profile": {
                               "skill_level": user_profile.skill_level,
                               "interaction_count": user_profile.interaction_count,
                               "preferred_topics": user_profile.preferred_topics
                           }}

            if intent == "basic_web":
                web_response = self._handle_basic_web(language, entities)
                response_data["response"] = web_response["instructions"]
                response_data["web_info"] = web_response
            elif intent == "course_recommend":
                response_text, recommendations = self._handle_course_recommendation(query, language, entities, user_profile)
                response_data["response"] = response_text
                response_data["recommendations"] = [{
                    "title": r.title,
                    "description": r.description,
                    "level": r.level,
                    "url": f"/course-detail/{r.slug}",
                    "relevance_score": round(r.final_score, 3)
                } for r in recommendations]
            else:
                response_data["response"] = self._handle_general_inquiry(query, language, entities, context, user_profile)
            
            session_id = session_id or str(uuid.uuid4())
            self.add_memory(query, user_id=user_id, metadata={
                "role": "user", "language": language, "intent": intent,
                "confidence": confidence, "entities": entities, "session_id": session_id
            })
            
            self.add_memory(response_data["response"], user_id=user_id, metadata={
                "role": "assistant", "language": language, "intent": intent, "session_id": session_id
            })
            
            return response_data
            
        except Exception as e:
            logger.error(f"Query handling failed: {e}")
            return {
                "response": "I'm here to help you. Please let me know what you need assistance with.",
                "language": "en", "intent": "general_inquiry", "confidence": 0.0,
                "entities": {}, "recommendations": [], "error": str(e)
            }

    def get_user_analytics(self, user_id: str) -> Dict:
        profile = self.get_or_create_user_profile(user_id)
        memories = self.get_all_memories(user_id)
        
        intent_distribution = {}
        for memory in memories:
            intent = memory.get("metadata", {}).get("intent", "unknown")
            intent_distribution[intent] = intent_distribution.get(intent, 0) + 1
        
        return {
            "user_id": user_id,
            "profile": {
                "skill_level": profile.skill_level,
                "preferred_topics": profile.preferred_topics,
                "interaction_count": profile.interaction_count,
                "satisfaction_score": profile.satisfaction_score
            },
            "interaction_analytics": {
                "total_interactions": len(memories),
                "intent_distribution": intent_distribution,
                "last_interaction": profile.last_interaction
            }
        }

    def get_all_memories(self, user_id: str = None):
        if not user_id:
            return []
        try:
            scroll_result = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(must=[FieldCondition(key="metadata.user_id", match=MatchValue(value=user_id))]),
                limit=1000, with_payload=True, with_vectors=False
            )
            return [{
                "text": r.payload["text"],
                "metadata": r.payload["metadata"],
                "timestamp": r.payload.get("timestamp")
            } for r in scroll_result[0]]
        except Exception as e:
            logger.error(f"Failed to get memories: {e}")
            return []

    def delete_memories(self, user_id: str):
        try:
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(must=[FieldCondition(key="metadata.user_id", match=MatchValue(value=user_id))])
            )
            if user_id in self.user_profiles:
                del self.user_profiles[user_id]
            return True
        except Exception as e:
            logger.error(f"Failed to delete memories for user {user_id}: {e}")
            return False

    def update_user_satisfaction(self, user_id: str, satisfaction_score: float):
        profile = self.get_or_create_user_profile(user_id)
        profile.satisfaction_score = satisfaction_score
        
        self.add_memory(
            f"User satisfaction feedback: {satisfaction_score}/5.0",
            user_id=user_id,
            metadata={
                "type": "satisfaction_feedback",
                "score": satisfaction_score,
                "timestamp": datetime.utcnow().isoformat()
            }
        )