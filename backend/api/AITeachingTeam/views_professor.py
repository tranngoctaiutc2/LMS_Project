from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
import google.generativeai as genai
from api import models as api_models
from django.conf import settings
from api.AITeachingTeam.utils import (
    search_serpapi_links,
    create_google_doc,
    extract_text_from_google_doc,
    update_google_doc,
)
import time
import json
from typing import List, Tuple, Dict, Any

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

def get_enhanced_references(topic: str, max_results: int = 12, is_recent: bool = False) -> List[Tuple[str, str]]:
    # Lấy tham chiếu thô mà không cần lọc hoặc ưu tiên
    raw_references = search_serpapi_links(topic, is_update=is_recent, max_results=max_results)
    # Chỉ giữ các tham chiếu hợp lệ (có tiêu đề và URL)
    valid_references = [(title, url) for title, url in raw_references if title and url]
    return valid_references[:max_results]

def generate_professor_content(topic: str, language: str = "en") -> str:
    # Lấy danh sách tham chiếu
    primary_refs = get_enhanced_references(topic, max_results=8, is_recent=False)
    recent_refs = get_enhanced_references(topic, max_results=4, is_recent=True)
    
    all_refs = primary_refs[:6] + recent_refs[:3]
    valid_references = all_refs[:8]  # Giới hạn ở 8 tham chiếu
    
    if len(valid_references) < 3:
        valid_references = all_refs[:3]
    
    references_text = "\n".join([f"- [{title}]({url})" for title, url in valid_references])
    
    # Prompt thống nhất cho nội dung
    main_prompt = f"""
🚨 **CRITICAL:** You MUST use all the references provided below. **Do not skip any.** Each reference must be cited **at least once** throughout the content.

You are a leading Professor expert tasked with creating a **COMPREHENSIVE BUT CONCISE** academic knowledge base on the topic: **"{topic}"**. 

**TARGET LENGTH: 15-17 pages (approximately 8,000-10,000 words)**

**PRIMARY OBJECTIVES:**
- Create well-structured, medium-length academic content
- Provide comprehensive coverage without excessive detail
- Ensure high reliability through authoritative sources
- Balance depth with readability

---

### 📚 OPTIMIZED STRUCTURE (Target: 15-17 pages total)

#### 🎯 1. INTRODUCTION AND OVERVIEW (2-3 pages)
- **Core definitions and key concepts** (2-3 paragraphs, 3-4 sentences each)
- **Historical context and significance** (2 paragraphs with timeline)
- **Academic and practical importance** (2 paragraphs with examples)
- **Current state and scope** (1-2 paragraphs)

#### 🔤 2. KEY TERMINOLOGY (1 page)
List **8-10 essential terms** with concise definitions:
- **Term**: Clear definition (2-3 sentences), relevant example
- Organized by importance and complexity

#### 🧠 3. FUNDAMENTAL CONCEPTS (3-4 pages)
Explain **6-8 core concepts**, each including:
- **Theoretical foundation** (3-4 sentences)
- **Practical application** (2-3 sentences with example)
- **Relationship to other concepts** (1-2 sentences)

#### 🚀 4. ADVANCED TOPICS (3-4 pages)
**5-6 advanced topics**, each including:
- **Deep analysis** (4-5 sentences)
- **Current research and developments** (3-4 sentences)
- **Real-world implications** (2-3 sentences)

#### 🌐 5. CURRENT TRENDS AND APPLICATIONS (2-3 pages)
**4-5 current trends** covering:
- **Trend description and significance** (3-4 sentences)
- **Industry applications** (2-3 sentences with case study)
- **Future implications** (2-3 sentences)

#### 💡 6. PRACTICAL APPLICATIONS AND CASE STUDIES (2-3 pages)
**4-5 practical applications** with:
- **Application overview** (3-4 sentences)
- **Specific case study** (3-4 sentences)
- **Results and lessons learned** (2-3 sentences)

#### ⚡ 7. CHALLENGES AND LIMITATIONS (1-2 pages)
- **Current main challenges** (4-5 challenges, 2-3 sentences each)
- **Proposed solutions and approaches** (2-3 paragraphs)

#### 🔮 8. FUTURE PROSPECTS (1-2 pages)
- **Expected developments** (3-4 trends, 2-3 sentences each)
- **Emerging opportunities** (2-3 paragraphs)
- **Skills and knowledge requirements** (1-2 paragraphs)

#### 📝 9. SUMMARY AND KEY TAKEAWAYS (1 page)
- **10-12 key insights** (1-2 sentences each)
- **Practical recommendations** (2-3 paragraphs)
- **Further learning directions** (1 paragraph)

---

### 🛠 CONTENT REQUIREMENTS

**Language and Structure:**
- Write in {language_instruction(language)}
- Use formal academic style but accessible language
- Each section should be substantial but focused
- Avoid unnecessary repetition or overly technical jargon

**Citations and References:**
- Use natural phrasing: "According to [title]..." or "Research from [title] indicates..."
- Integrate insights from references throughout content
- **Each reference must be cited at least once**
- Combine reference insights with expert knowledge

**Formatting:**
- Use `##` for main sections, `###` for subsections
- **Bold** for key terms, *italics* for emphasis
- Clear paragraph structure with logical flow
- Include bullet points for lists where appropriate

**Quality Standards:**
- Focus on essential information rather than exhaustive detail
- Include specific examples and case studies
- Maintain academic rigor while ensuring readability
- Balance theoretical knowledge with practical applications

**TARGET OUTPUT: Create a comprehensive yet concise {8000}-{10000} word academic document suitable for university students and professionals.**

---

### 📚 REFERENCES TO USE:
{references_text}

**Note: All references will be properly formatted and listed at the end of the document.**
"""

    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    try:
        response = model.generate_content(
            main_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=24576,
                temperature=0.3,
            )
        )
        
        content = response.text.strip()
        ref_title = "📚 References" if language == "en" else "📚 Tài liệu tham khảo"
        references_section = f"\n\n---\n\n## {ref_title}\n\n"
        
        for i, (title, url) in enumerate(valid_references, 1):
            references_section += f"{i}. **{title}**  \n   {url}\n\n"
        
        return content + references_section
        
    except Exception as e:
        return generate_content_in_chunks(topic, valid_references, language)

def language_instruction(language: str) -> str:
    return "Vietnamese" if language == "vi" else "English"

def generate_content_in_chunks(topic: str, references: List[Tuple[str, str]], language: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    sections = [
        "Introduction and Overview",
        "Key Terminology", 
        "Fundamental Concepts",
        "Advanced Topics",
        "Current Trends and Applications",
        "Practical Applications",
        "Challenges and Future Prospects",
        "Summary"
    ]
    
    title_prefix = "# 📘 Knowledge Base"
    content_updating = "Content is being updated..."
    language_instruction_text = language_instruction(language)
    
    full_content = f"{title_prefix} - {topic}\n\n"
    references_text = "\n".join([f"- [{title}]({url})" for title, url in references])
    
    for section in sections:
        try:
            section_prompt = f"""
            Write concise "{section}" section for topic "{topic}".
            Target: 1-2 pages per section, clear and focused content.
            Use these sources: {references_text}
            Language: {language_instruction_text}
            Cite sources naturally throughout the content.
            """
            
            response = model.generate_content(
                section_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=8192,
                    temperature=0.3,
                )
            )
            full_content += f"\n## {section}\n\n{response.text.strip()}\n\n"
            
            time.sleep(1)
            
        except Exception as e:
            full_content += f"\n## {section}\n\n{content_updating}\n\n"
    
    ref_title = "📚 References" if language == "en" else "📚 Tài liệu tham khảo"
    references_section = f"\n---\n\n## {ref_title}\n\n"
    
    for i, (title, url) in enumerate(references, 1):
        references_section += f"{i}. **{title}**  \n   {url}\n\n"
    
    return full_content + references_section

def generate_professor_update(topic: str, previous_summary: str, language: str = "en") -> str:
    recent_refs = get_enhanced_references(topic, max_results=8, is_recent=True)
    valid_references = recent_refs[:5]  # Giới hạn ở 5 tham chiếu
    
    if len(valid_references) < 2:
        valid_references = recent_refs[:2]

    references_text = "\n".join([f"- [{title}]({url})" for title, url in valid_references])

    enhanced_update_prompt = f"""
You are a leading expert on **"{topic}"**. Your task is to create a **FOCUSED UPDATE** to existing knowledge base with new developments.

**Current content (SUMMARY):**
--- START SUMMARY ---
{previous_summary[:2000]}
--- END SUMMARY ---

**TARGET: Concise but comprehensive update (3-5 pages)**

### 🔄 STRUCTURED UPDATE

#### 📈 1. RECENT DEVELOPMENTS (1-2 pages)
**4-5 key new developments** from the last 2 years:
- **Development overview** (3-4 sentences)
- **Significance and impact** (2-3 sentences)
- **Connection to existing knowledge** (1-2 sentences)

#### 🔬 2. NEW RESEARCH AND INNOVATIONS (1 page)
- **2-3 breakthrough studies** with key findings
- **Emerging methodologies** and their applications
- **Unexpected results** and paradigm shifts

#### 🌐 3. PRACTICAL IMPLICATIONS (1 page)
- **New applications and use cases** (3-4 examples)
- **Industry adoption** and implementation challenges
- **Real-world case studies** with outcomes

#### ⚡ 4. EMERGING CHALLENGES (0.5-1 page)
- **3-4 new challenges** not previously identified
- **Proposed solutions** and ongoing research
- **Future risk assessment**

#### 🔮 5. FUTURE OUTLOOK (0.5-1 page)
- **Predicted developments** for next 3-5 years
- **Market opportunities** and growth areas
- **Skills and knowledge requirements**

#### 📝 6. UPDATE SUMMARY (0.5 page)
**8-10 key takeaways** from this update:
- Most significant new insights
- Actionable recommendations
- Areas requiring further attention

---

### 🛠 TECHNICAL REQUIREMENTS

**Content Quality:**
- Write in {language_instruction(language)}
- Focus on new information not in the original summary
- Each reference must be cited at least once
- Balance technical detail with accessibility

**Citations:**
- Natural integration: "According to [title]..." or "Recent research from [title]..."
- **Must use all provided references**
- Combine new findings with existing knowledge

**Formatting:**
- `##` for main sections, `###` for subsections  
- **Bold** for key terms, *italics* for emphasis
- Clear, focused paragraphs
- Professional academic style

**OBJECTIVE: Create a focused, high-quality update that enhances the existing knowledge base without excessive length.**

### 📚 NEW REFERENCES TO USE:
{references_text}
"""

    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    try:
        response = model.generate_content(
            enhanced_update_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=16384,
                temperature=0.2,
            )
        )
        
        content = response.text.strip()
        ref_title = "📚 New References" if language == "en" else "📚 Tài liệu tham khảo mới"
        references_section = f"\n\n---\n\n## {ref_title}\n\n"
        
        for i, (title, url) in enumerate(valid_references, 1):
            references_section += f"{i}. **{title}**  \n   {url}\n\n"
        
        return content + references_section
        
    except Exception as e:
        return generate_simple_update(topic, previous_summary, valid_references, language)

def generate_simple_update(topic: str, previous_summary: str, references: List[Tuple[str, str]], language: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    simple_prompt = f"""
    Create a focused update for topic "{topic}" based on:
    
    Current summary: {previous_summary[:1500]}...
    
    Target: 3-4 new developments, each 200-300 words.
    Language: {language_instruction(language)}
    Include practical examples and cite provided sources.
    
    References to use:
    {chr(10).join([f"- [{title}]({url})" for title, url in references])}
    """
    
    try:
        response = model.generate_content(
            simple_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=8192,
                temperature=0.3,
            )
        )
        
        content = response.text.strip()
        ref_title = "📚 References" if language == "en" else "📚 Tài liệu tham khảo"
        references_section = f"\n\n---\n\n## {ref_title}\n\n"
        
        for i, (title, url) in enumerate(references, 1):
            references_section += f"{i}. **{title}**  \n   {url}\n\n"
        
        return content + references_section
        
    except:
        return generate_basic_fallback_content(topic, language)

def generate_content_with_retries(topic: str, language: str = "en", max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            return generate_professor_content(topic, language)
            
        except Exception as e:
            if attempt == max_retries - 1:
                return generate_basic_fallback_content(topic, language)
            
            time.sleep(5)
    
    return generate_basic_fallback_content(topic, language)

def generate_basic_fallback_content(topic: str, language: str) -> str:
    if language == "vi":
        return f"""
## Cơ sở tri thức: {topic}

### Giới thiệu
Nội dung về {topic} đang được cập nhật. Vui lòng thử lại sau.

### Thông tin cơ bản
Chủ đề này đang được nghiên cứu và phát triển nội dung chi tiết.

---

## 📚 Tài liệu tham khảo
Các nguồn tham khảo sẽ được bổ sung trong phiên bản cập nhật tiếp theo.
"""
    else:
        return f"""
## Knowledge Base: {topic}

### Introduction
Content about {topic} is being updated. Please try again later.

### Basic Information
This topic is being researched and detailed content is being developed.

---

## 📚 References
Reference sources will be added in the next update.
"""

class ProfessorAgentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("topic")
        user_id = request.data.get("user_id")
        doc_url = request.data.get("doc_url", None)
        language = request.data.get("language", "en")
        
        use_enhanced_generation = request.data.get("use_enhanced_generation", True)

        if not topic or not user_id:
            return Response(
                {"error": "Missing 'topic' or 'user_id'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES
            )

            if doc_url:
                previous_summary = extract_text_from_google_doc(doc_url, creds)
                update_content = generate_professor_update(topic, previous_summary, language)
                update_google_doc(doc_url, update_content, creds)
                
                return Response({
                    "message": "Document updated successfully with focused content.",
                    "doc_url": doc_url,
                    "content_stats": {
                        "word_count": len(update_content.split()),
                        "target_length": "3-5 pages"
                    }
                })

            else:
                content = generate_content_with_retries(topic, language)
                doc_title = f"📘 Knowledge Base - {topic}" if language == "en" else f"📘 Cơ sở Tri thức - {topic}"
                
                doc_url = create_google_doc(
                    title=doc_title,
                    content=content,
                    creds=creds,
                    share_email=user.email
                )

                document = api_models.UserDocument.objects.create(
                    user=user,
                    topic=topic,
                    doc_url=doc_url,
                    ai_type="professor",
                    language=language
                )

                return Response({
                    "message": "Optimized document created successfully.",
                    "doc_url": doc_url,
                    "content_stats": {
                        "word_count": len(content.split()),
                        "target_length": "15-17 pages",
                        "estimated_pages": len(content.split()) // 500
                    }
                })

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )