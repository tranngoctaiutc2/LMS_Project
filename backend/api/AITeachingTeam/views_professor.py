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

def is_course_link(url: str) -> bool:
    course_keywords = [
        "coursera.org", "udemy.com", "edx.org", "khanacademy.org", 
        "futurelearn.com", "classcentral.com", "skillshare.com", 
        "pluralsight.com", "codecademy.com", "openlearning.com"
    ]
    return any(keyword in url for keyword in course_keywords)

def prioritize_academic_sources(references: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    academic_domains = [
        "edu", "gov", "org", "ieee.org", "acm.org", "springer.com", 
        "sciencedirect.com", "nature.com", "arxiv.org", "pubmed.ncbi.nlm.nih.gov",
        "scholar.google.com", "researchgate.net", "jstor.org", "mit.edu",
        "stanford.edu", "harvard.edu", "cambridge.org", "oxford.com"
    ]
    
    academic_refs = []
    other_refs = []
    
    for title, url in references:
        if not title or not url or is_course_link(url):
            continue
            
        if any(domain in url for domain in academic_domains):
            academic_refs.append((title, url))
        else:
            other_refs.append((title, url))
    
    return academic_refs + other_refs

def get_enhanced_references(topic: str, max_results: int = 15, is_recent: bool = False) -> List[Tuple[str, str]]:
    raw_references = search_serpapi_links(topic, is_update=is_recent, max_results=max_results)
    prioritized_refs = prioritize_academic_sources(raw_references)
    return prioritized_refs[:max_results]

def generate_comprehensive_outline(topic: str, references: List[Tuple[str, str]], language: str = "en") -> Dict[str, Any]:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    refs_text = "\n".join([f"- {title}: {url}" for title, url in references[:5]])
    
    if language == "vi":
        outline_prompt = f"""
        Bạn là một chuyên gia học thuật. Tạo đề cương chi tiết và toàn diện cho chủ đề: "{topic}"
        
        Dựa trên các tài liệu tham khảo sau:
        {refs_text}
        
        Tạo đề cương JSON với cấu trúc sau (bằng tiếng Việt):
        {{
            "main_sections": [
                {{
                    "title": "Tên phần",
                    "subsections": ["phần con 1", "phần con 2", ...],
                    "key_points": ["điểm chính 1", "điểm chính 2", ...],
                    "examples_needed": ["ví dụ 1", "ví dụ 2", ...]
                }}
            ],
            "depth_areas": ["lĩnh vực sâu 1", "lĩnh vực sâu 2", ...],
            "current_trends": ["xu hướng 1", "xu hướng 2", ...],
            "practical_focus": ["ứng dụng thực tế 1", "ứng dụng thực tế 2", ...]
        }}
        
        Chỉ trả về JSON, không có văn bản khác.
        """
    else:
        outline_prompt = f"""
        You are an academic expert. Create a detailed and comprehensive outline for the topic: "{topic}"
        
        Based on the following references:
        {refs_text}
        
        Create a JSON outline with the following structure:
        {{
            "main_sections": [
                {{
                    "title": "Section name",
                    "subsections": ["subsection1", "subsection2", ...],
                    "key_points": ["key point 1", "key point 2", ...],
                    "examples_needed": ["example 1", "example 2", ...]
                }}
            ],
            "depth_areas": ["deep area 1", "deep area 2", ...],
            "current_trends": ["trend 1", "trend 2", ...],
            "practical_focus": ["practical application 1", "practical application 2", ...]
        }}
        
        Return only JSON, no other text.
        """
    
    try:
        response = model.generate_content(outline_prompt)
        return json.loads(response.text.strip())
    except:
        if language == "vi":
            return {
                "main_sections": [
                    {
                        "title": "Giới thiệu và Tổng quan",
                        "subsections": ["Định nghĩa", "Tầm quan trọng", "Bối cảnh lịch sử"],
                        "key_points": ["Khái niệm cơ bản", "Ý nghĩa thực tiễn"],
                        "examples_needed": ["Ví dụ minh họa"]
                    }
                ],
                "depth_areas": ["Lý thuyết cơ bản", "Ứng dụng thực tiễn"],
                "current_trends": ["Phát triển mới nhất"],
                "practical_focus": ["Ứng dụng thực tế"]
            }
        else:
            return {
                "main_sections": [
                    {
                        "title": "Introduction and Overview",
                        "subsections": ["Definition", "Importance", "Historical Context"],
                        "key_points": ["Basic concepts", "Practical significance"],
                        "examples_needed": ["Illustrative example"]
                    }
                ],
                "depth_areas": ["Basic theory", "Practical applications"],
                "current_trends": ["Latest developments"],
                "practical_focus": ["Real-world applications"]
            }

def generate_section_content(section_info: Dict, topic: str, references: List[Tuple[str, str]], language: str = "en") -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    refs_text = "\n".join([f"- [{title}]({url})" for title, url in references])
    
    if language == "vi":
        section_prompt = f"""
        Bạn là chuyên gia về "{topic}". Viết nội dung chi tiết cho phần: "{section_info['title']}"
        
        **Yêu cầu cụ thể:**
        - Các phần con cần đề cập: {', '.join(section_info['subsections'])}
        - Điểm chính: {', '.join(section_info['key_points'])}
        - Ví dụ cần thiết: {', '.join(section_info['examples_needed'])}
        
        **Tài liệu tham khảo sử dụng:**
        {refs_text}
        
        **Yêu cầu định dạng:**
        - Mỗi phần con: 4-6 đoạn văn (3-5 câu mỗi đoạn)
        - Bao gồm ví dụ cụ thể, dữ liệu, nghiên cứu điển hình
        - Tích hợp trích dẫn tự nhiên: "Theo [title]..." 
        - Sử dụng markdown với tiêu đề phù hợp
        - Tối đa hóa chi tiết mà không lặp lại
        
        Viết nội dung bằng tiếng Việt sử dụng ngôn ngữ học thuật rõ ràng phù hợp cho sinh viên đại học.
        """
    else:
        section_prompt = f"""
        You are an expert on "{topic}". Write detailed content for the section: "{section_info['title']}"
        
        **Specific requirements:**
        - Subsections to cover: {', '.join(section_info['subsections'])}
        - Key points: {', '.join(section_info['key_points'])}
        - Examples needed: {', '.join(section_info['examples_needed'])}
        
        **References to use:**
        {refs_text}
        
        **Format requirements:**
        - Each subsection: 4-6 paragraphs (3-5 sentences each)
        - Include specific examples, data, case studies
        - Natural citation integration: "According to [title]..." 
        - Use markdown with appropriate headers
        - Maximize detail without repetition
        
        Write content in English using clear academic language suitable for university students.
        """
    
    try:
        response = model.generate_content(
            section_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=16384,
                temperature=0.3,
            )
        )
        return response.text.strip()
    except Exception as e:
        section_title = section_info['title']
        if language == "vi":
            return f"### {section_title}\n\nNội dung đang được cập nhật..."
        else:
            return f"### {section_title}\n\nContent is being updated..."

def generate_professor_content(topic: str, language: str = "en") -> str:
    primary_refs = get_enhanced_references(topic, max_results=12, is_recent=False)
    recent_refs = get_enhanced_references(topic, max_results=8, is_recent=True)
    
    all_refs = primary_refs[:8] + recent_refs[:4]
    valid_references = [ref for ref in all_refs if ref[0] and ref[1]][:10]
    
    if len(valid_references) < 3:
        valid_references = all_refs[:3]
    
    outline = generate_comprehensive_outline(topic, valid_references, language)
    references_text = "\n".join([f"- [{title}]({url})" for title, url in valid_references])
    
    if language == "vi":
        main_prompt = f"""
🚨 **QUAN TRỌNG:** Bạn PHẢI sử dụng tất cả các tài liệu tham khảo được cung cấp bên dưới. **Không được bỏ qua bất kỳ tài liệu nào.** Mỗi tài liệu tham khảo phải được trích dẫn **ít nhất 2 lần** và **mỗi phần nội dung phải dựa trên chúng.**

---

### 🔗 Tài liệu tham khảo bắt buộc
{references_text}

---

Bạn là một Giáo sư hàng đầu chuyên gia được giao nhiệm vụ tạo ra một cơ sở tri thức học thuật **CỰC KỲ CHI TIẾT VÀ TOÀN DIỆN** về chủ đề: **"{topic}"**. 

**MỤC TIÊU CHÍNH:**
- Tạo nội dung học thuật dài nhất có thể (không giới hạn độ dài)
- Cung cấp chi tiết tối đa cho sinh viên và người tự học
- Đảm bảo độ tin cậy cao thông qua sử dụng các nguồn có thẩm quyền
- Tích hợp thông tin từ nhiều góc nhìn và quan điểm khác nhau

---

### 📚 CẤU TRÚC CHI TIẾT (Tối đa hóa nội dung cho mỗi phần)

#### 🎯 1. GIỚI THIỆU TOÀN DIỆN (8-12 đoạn văn)
- **Định nghĩa và khái niệm cốt lõi** (3-4 đoạn văn, 4-6 câu mỗi đoạn)
- **Bối cảnh lịch sử và phát triển** (2-3 đoạn văn với dòng thời gian chi tiết)
- **Tầm quan trọng học thuật và thực tiễn** (2-3 đoạn văn với ví dụ cụ thể)
- **Các trường phái tư tưởng và quan điểm khác nhau** (2-3 đoạn văn)

#### 🔤 2. HỆ THỐNG THUẬT NGỮ VÀ KHÁI NIỆM (15-20 thuật ngữ)
Liệt kê **15-20 thuật ngữ cốt lõi** với định nghĩa chi tiết:
- **Thuật ngữ**: Định nghĩa đầy đủ (3-4 câu), nguồn gốc từ nguyên, ví dụ minh họa
- Phân loại theo cấp độ: Cơ bản → Trung cấp → Nâng cao
- Mối quan hệ giữa các thuật ngữ

#### 🧠 3. KHÁI NIỆM CƠ BẢN (12-15 khái niệm)
Giải thích **12-15 khái niệm chính**, mỗi khái niệm bao gồm:
- **Lý thuyết nền tảng** (4-5 câu)
- **Ví dụ thực tế và nghiên cứu điển hình** (3-4 câu)
- **So sánh và đối chiếu** với các khái niệm liên quan (2-3 câu)
- **Ứng dụng thực tiễn** (2-3 câu)

#### 🚀 4. CHỦ ĐỀ NÂNG CAO VÀ CHUYÊN BIỆT (10-12 chủ đề)
**10-12 chủ đề phức tạp**, mỗi chủ đề bao gồm:
- **Phân tích lý thuyết sâu** (5-6 câu)
- **Mô hình và khung lý thuyết** (với mô tả chi tiết)
- **Nghiên cứu học thuật liên quan** (trích dẫn cụ thể)
- **Tranh luận và quan điểm khác nhau** (4-5 câu)
- **Tác động và ý nghĩa** (3-4 câu)

#### 🌐 5. XU HƯỚNG VÀ PHÁT TRIỂN HIỆN TẠI (8-10 xu hướng)
**8-10 xu hướng gần đây** (5 năm qua):
- **Mô tả xu hướng chi tiết** (4-5 câu)
- **Tích hợp sâu từ các nguồn tham khảo** (trích dẫn cụ thể)
- **Tác động đến lĩnh vực và xã hội** (3-4 câu)
- **Dự đoán tương lai và triển vọng** (3-4 câu)

#### 💡 6. ỨNG DỤNG THỰC TIỄN VÀ NGHIÊN CỨU ĐIỂN HÌNH (10-12 ứng dụng)
**10-12 ứng dụng thực tế** với:
- **Mô tả ứng dụng chi tiết** (4-5 câu)
- **Nghiên cứu điển hình cụ thể** (5-6 câu)
- **Phân tích lợi ích và thách thức** (3-4 câu)
- **Bài học kinh nghiệm** (2-3 câu)

#### 🔬 7. NGHIÊN CỨU VÀ DỮ LIỆU
- **Các nghiên cứu quan trọng nhất** (5-7 nghiên cứu)
- **Phân tích dữ liệu và thống kê** (với nguồn cụ thể)
- **Phương pháp nghiên cứu và cách tiếp cận**
- **Kết quả và phát hiện chính**

#### 🌍 8. QUAN ĐIỂM QUỐC TẾ VÀ ĐA VĂN HOÁ
- **So sánh các cách tiếp cận khác nhau** giữa các quốc gia/khu vực
- **Ảnh hưởng văn hóa và xã hội**
- **Thực tiễn tốt nhất toàn cầu**
- **Thách thức triển khai quốc tế**

#### ⚡ 9. THÁCH THỨC VÀ HẠN CHẾ
- **Các thách thức chính hiện tại** (6-8 thách thức)
- **Phân tích nguyên nhân gốc rễ và xem xét sâu**
- **Chiến lược giải pháp được đề xuất**
- **Rào cản triển khai và khó khăn**

#### 🔮 10. TRIỂN VỌNG TƯƠNG LAI
- **Dự đoán phát triển 5-10 năm**
- **Công nghệ và đổi mới mới**
- **Cơ hội và thị trường tiềm năng**
- **Kỹ năng và kiến thức cần thiết**

#### 📝 11. TÓM TẮT TOÀN DIỆN
- **15-20 điểm chính** được tóm tắt ngắn gọn
- **Những hiểu biết quan trọng nhất**
- **Hướng dẫn để tiếp tục học tập**

#### 🔗 12. Tài liệu:
{references_text}

---

### 🛠 YÊU CẦU KỸ THUẬT

**Định dạng markdown nâng cao:**
- Sử dụng `####` cho các phần, `#####` cho các phần con
- Dấu đầu dòng với `-`, **in đậm** để nhấn mạnh
- Emoji để phân biệt trực quan
- Đoạn văn ngắn (2-4 câu) với khoảng cách rõ ràng
- Bảng và sơ đồ dạng văn bản khi cần thiết

**Yêu cầu nội dung:**
- **Tối đa hóa chi tiết trong MỌI phần**
- Phong cách viết học thuật chính thức nhưng dễ tiếp cận
- **Ưu tiên các hiểu biết từ các nguồn tham khảo** (trích dẫn tự nhiên)
- Tránh lặp lại, thuật ngữ không cần thiết
- Bao gồm ví dụ cụ thể, dữ liệu, nghiên cứu điển hình
- **Phải trích dẫn ít nhất 2 lần từ mỗi tài liệu tham khảo**

**Trích dẫn:**
- Sử dụng cách diễn đạt tự nhiên: *"Theo [title]..."*, *"Như được chỉ ra trong [title]..."*
- Kết hợp hiểu biết từ tài liệu tham khảo và kiến thức của mô hình
- **KHÔNG ĐƯỢC bỏ qua hoặc thay thế các tài liệu tham khảo được cung cấp**

Viết toàn bộ nội dung bằng tiếng Việt sử dụng ngôn ngữ học thuật rõ ràng, chính thức phù hợp cho sinh viên đại học và người tự học.

**🎯 MỤC TIÊU CUỐI CÙNG: Tạo ra tài liệu học thuật dài nhất, chi tiết nhất và đáng tin cậy nhất có thể về chủ đề này.**
"""
    else:
        main_prompt = f"""
🚨 **CRITICAL:** You MUST use all the references provided below. **Do not skip any.** Each reference must be cited **at least 2 times** and **each content section must be based on them.**

---

### 🔗 Mandatory References
{references_text}

---

You are a leading Professor expert tasked with creating an **EXTREMELY DETAILED AND COMPREHENSIVE** academic knowledge base on the topic: **"{topic}"**. 

**PRIMARY OBJECTIVES:**
- Create the longest possible academic content (no length limit)
- Provide maximum detail for students and self-learners
- Ensure high reliability through use of authoritative sources
- Integrate information from multiple perspectives and viewpoints

---

### 📚 DETAILED STRUCTURE (Maximize content for each section)

#### 🎯 1. COMPREHENSIVE INTRODUCTION (8-12 paragraphs)
- **Core definitions and concepts** (3-4 paragraphs, 4-6 sentences each)
- **Historical context and development** (2-3 paragraphs with detailed timeline)
- **Academic and practical importance** (2-3 paragraphs with specific examples)
- **Different schools of thought and perspectives** (2-3 paragraphs)

#### 🔤 2. TERMINOLOGY AND CONCEPTS SYSTEM (15-20 terms)
List **15-20 core terms** with detailed definitions:
- **Term**: Complete definition (3-4 sentences), etymology, illustrative examples
- Classification by level: Basic → Intermediate → Advanced
- Relationships between terms

#### 🧠 3. FUNDAMENTAL CONCEPTS (12-15 concepts)
Explain **12-15 key concepts**, each including:
- **Foundational theory** (4-5 sentences)
- **Real-world examples and case studies** (3-4 sentences)
- **Comparisons and contrasts** with related concepts (2-3 sentences)
- **Practical applications** (2-3 sentences)

#### 🚀 4. ADVANCED AND SPECIALIZED TOPICS (10-12 topics)
**10-12 complex topics**, each including:
- **Deep theoretical analysis** (5-6 sentences)
- **Models and frameworks** (with detailed descriptions)
- **Related academic research** (specific citations)
- **Debates and different viewpoints** (4-5 sentences)
- **Implications and significance** (3-4 sentences)

#### 🌐 5. CURRENT TRENDS AND DEVELOPMENTS (8-10 trends)
**8-10 recent trends** (last 5 years):
- **Detailed trend description** (4-5 sentences)
- **Deep integration from reference sources** (specific citations)
- **Impact on field and society** (3-4 sentences)
- **Future predictions and prospects** (3-4 sentences)

#### 💡 6. PRACTICAL APPLICATIONS AND CASE STUDIES (10-12 applications)
**10-12 practical applications** with:
- **Detailed application description** (4-5 sentences)
- **Specific case studies** (5-6 sentences)
- **Benefits and challenges analysis** (3-4 sentences)
- **Lessons learned** (2-3 sentences)

#### 🔬 7. RESEARCH AND DATA
- **Most important research studies** (5-7 studies)
- **Data and statistics analysis** (with specific sources)
- **Research methodology and approaches**
- **Key results and findings**

#### 🌍 8. INTERNATIONAL AND MULTICULTURAL PERSPECTIVES
- **Different approaches comparison** between countries/regions
- **Cultural and social influences**
- **Global best practices**
- **International implementation challenges**

#### ⚡ 9. CHALLENGES AND LIMITATIONS
- **Current main challenges** (6-8 challenges)
- **Root cause analysis and deep examination**
- **Proposed solution strategies**
- **Implementation barriers and difficulties**

#### 🔮 10. FUTURE PROSPECTS
- **5-10 year development predictions**
- **New technologies and innovations**
- **Potential opportunities and markets**
- **Required skills and knowledge**

#### 📝 11. COMPREHENSIVE SUMMARY
- **15-20 main points** concisely summarized
- **Most important insights**
- **Guidelines for continued learning**

#### 🔗 12. References:
{references_text}
---

### 🛠 TECHNICAL REQUIREMENTS

**Advanced markdown formatting:**
- Use `####` for sections, `#####` for subsections
- Bullet points with `-`, **bold** for emphasis
- Emojis for visual distinction
- Short paragraphs (2-4 sentences) with clear spacing
- Text-based tables and diagrams when needed

**Content requirements:**
- **Maximize detail in EVERY section**
- Formal academic writing style but accessible
- **Prioritize insights from reference sources** (natural citations)
- Avoid repetition, unnecessary jargon
- Include specific examples, data, case studies
- **Must cite at least 2 times from each reference**

**Citations:**
- Use natural phrasing: *"According to [title]..."*, *"As indicated in [title]..."*
- Combine insights from references and model knowledge
- **MUST NOT skip or replace provided references**

Write all content in English using clear, formal academic language suitable for university students and self-learners.

**🎯 FINAL OBJECTIVE: Create the longest, most detailed and reliable academic document possible on this topic.**
"""

    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    try:
        response = model.generate_content(
            main_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=32768,
                temperature=0.3,
            )
        )
        return response.text.strip()
        
    except Exception as e:
        return generate_content_in_chunks(topic, valid_references, language)

def generate_content_in_chunks(topic: str, references: List[Tuple[str, str]], language: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    if language == "vi":
        sections = [
            "Giới thiệu và Tổng quan",
            "Hệ thống Thuật ngữ",
            "Khái niệm Cơ bản", 
            "Chủ đề Nâng cao",
            "Xu hướng Hiện tại",
            "Ứng dụng Thực tiễn",
            "Tóm tắt"
        ]
        title_prefix = "# 📘 Cơ sở tri thức"
        content_updating = "Nội dung đang được cập nhật..."
        min_words = "tối thiểu 800 từ"
        language_instruction = "tiếng Việt"
    else:
        sections = [
            "Introduction and Overview",
            "Terminology System",
            "Fundamental Concepts", 
            "Advanced Topics",
            "Current Trends",
            "Practical Applications",
            "Summary"
        ]
        title_prefix = "# 📘 Knowledge Base"
        content_updating = "Content is being updated..."
        min_words = "at least 800 words"
        language_instruction = "English"
    
    full_content = f"{title_prefix} - {topic}\n\n"
    references_text = "\n".join([f"- [{title}]({url})" for title, url in references])
    
    for section in sections:
        try:
            section_prompt = f"""
            Write detailed "{section}" section for topic "{topic}".
            Use these sources: {references_text}
            Language: {language_instruction}
            Requirement: Maximum detail, {min_words} for this section.
            """
            
            response = model.generate_content(
                section_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=16384,
                    temperature=0.3,
                )
            )
            full_content += f"\n## {section}\n\n{response.text.strip()}\n\n"
            
            time.sleep(1)
            
        except Exception as e:
            full_content += f"\n## {section}\n\n{content_updating}\n\n"
    
    ref_title = "🔗 Tài liệu tham khảo" if language == "vi" else "🔗 References"
    full_content += f"\n## {ref_title}\n\n{references_text}\n"
    
    return full_content

def generate_professor_update(topic: str, previous_summary: str, language: str = "en") -> str:
    recent_refs = get_enhanced_references(topic, max_results=10, is_recent=True)
    valid_references = [ref for ref in recent_refs if ref[0] and ref[1]][:6]
    
    if len(valid_references) < 2:
        valid_references = recent_refs[:2]

    references_text = "\n".join([f"{i+1}. [{title}]({url})" for i, (title, url) in enumerate(valid_references)])

    if language == "vi":
        enhanced_update_prompt = f"""
Bạn là chuyên gia hàng đầu về **"{topic}"**. Nhiệm vụ của bạn là cập nhật cơ sở tri thức hiện có với thông tin **CỰC KỲ CHI TIẾT VÀ MỚI NHẤT**.

**Nội dung hiện tại (TÓM TẮT):**
--- BẮT ĐẦU TÓM TẮT ---
{previous_summary}
--- KẾT THÚC TÓM TẮT ---

---

### 🔄 CẬP NHẬT TOÀN DIỆN VÀ CHI TIẾT

#### 📈 1. PHÁT TRIỂN MỚI NHẤT (8-12 phát triển)
**Yêu cầu: Ít nhất 8-12 phát triển mới (3 năm qua) KHÔNG có trong tóm tắt:**
- **Phân tích sâu** từ các nguồn tham khảo (chi tiết cụ thể)
- **Kết nối với kiến thức hiện có** để thể hiện sự tiến bộ
- **Nghiên cứu điển hình, dữ liệu, khung lý thuyết cụ thể** với ví dụ thực tế
- **Tác động đa chiều** đến lĩnh vực, ngành công nghiệp, xã hội
- **Xu hướng nghiên cứu mới** với phương pháp và phát hiện

#### 🔬 2. NGHIÊN CỨU ĐỘT PHÁ VÀ ĐỔI MỚI (6-8 nghiên cứu)
- **Nghiên cứu thay đổi cuộc chơi** từ 2-3 năm qua
- **Phương pháp mới và công nghệ đột phá**
- **Kết quả bất ngờ và sự thay đổi mô hình**
- **Tiềm năng ứng dụng chưa được khám phá**

#### 🌐 3. TÌNH HÌNH TOÀN CẦU VÀ SO SÁNH (5-7 khu vực)
- **So sánh các cách tiếp cận khác nhau** giữa các châu lục/quốc gia
- **Câu chuyện thành công và thất bại** từ các thị trường khác nhau
- **Sự khác biệt về văn hóa và quy định** và tác động của chúng
- **Hợp tác và thách thức toàn cầu**

#### ⚡ 4. THÁCH THỨC MỚI VÀ VẤN ĐỀ NỔI LÊN (6-8 thách thức)
- **Vấn đề mới xuất hiện** chưa được đề cập trước đây
- **Tác động đạo đức và xã hội** của các phát triển mới
- **Rào cản kỹ thuật và giải pháp** đang được khám phá
- **Rủi ro tương lai và chiến lược giảm thiểu**

#### 🔮 5. DỰ ĐOÁN VÀ LỘ TRÌNH TƯƠNG LAI (5-10 năm)
- **Dự đoán dựa trên bằng chứng** dựa trên xu hướng hiện tại
- **Sự hội tụ công nghệ** và hiệu ứng tương tác
- **Cơ hội thị trường và sự gián đoạn tiềm năng**
- **Khoảng cách kỹ năng và nhu cầu giáo dục**

#### 💼 6. TÁC ĐỘNG THỰC TIỄN MỚI (8-10 ứng dụng)
- **Trường hợp sử dụng và ứng dụng mới** chưa trở thành chủ đạo
- **Chiến lược triển khai** với bài học kinh nghiệm
- **Phân tích ROI và chi phí-lợi ích** từ các triển khai thực tế
- **Thực tiễn tốt nhất mới xuất hiện** từ các nhà lãnh đạo ngành

#### 📊 7. DỮ LIỆU VÀ CHỈ SỐ MỚI
- **Chỉ số hiệu suất chính** đang được theo dõi
- **Tiêu chuẩn và quy chuẩn mới**
- **Phương pháp đo lường** đang được phát triển
- **Phân tích so sánh** với dữ liệu lịch sử

#### 📝 8. TÓM TẮT CẬP NHẬT
**12-15 điểm chính** từ bản cập nhật:
- **Tính mới và ý nghĩa** của mỗi hiểu biết
- **Kết nối với cơ sở tri thức hiện có**
- **Kết luận có thể hành động** cho các nhà thực hành và nghiên cứu

#### 🔗 9. TÀI LIỆU MỚI
{references_text}

---

#### 🔗 TÀI LIỆU THAM KHẢO MỚI (PHẢI SỬ DỤNG TẤT CẢ)
{references_text}

---

### 🛠 YÊU CẦU KỸ THUẬT CHO CẬP NHẬT

**Tối đa hóa độ dài và chi tiết:**
- **Mỗi phần tối thiểu 1000-1500 từ**
- **Không giới hạn độ dài tổng thể**
- **Chi tiết cụ thể với ví dụ, số liệu, tên**

**Đảm bảo chất lượng:**
- **Tránh lặp lại** với tóm tắt hiện có
- **Phân tích sâu** thay vì mô tả bề mặt  
- **Bao quát đa góc độ** của mỗi chủ đề
- **Tuyên bố dựa trên bằng chứng** với trích dẫn phù hợp

**Yêu cầu trích dẫn:**
- **Tích hợp ít nhất 2 hiểu biết từ mỗi tài liệu tham khảo**
- Cách diễn đạt tự nhiên: *"Theo [title]..."*, *"Nghiên cứu từ [title] chỉ ra..."*
- **Kết hợp hiểu biết tài liệu tham khảo với kiến thức chuyên gia**
- **KHÔNG ĐƯỢC bỏ qua hoặc thay thế các tài liệu tham khảo được cung cấp**

**Định dạng Markdown:**
- `####` cho các phần chính, `#####` cho các phần con
- **In đậm** cho thuật ngữ chính, *in nghiêng* để nhấn mạnh
- Dấu đầu dòng, bảng, sơ đồ khi phù hợp
- Cấu trúc khoảng cách và đoạn văn rõ ràng

Viết toàn bộ nội dung bằng tiếng Việt sử dụng ngôn ngữ học thuật chính thức phù hợp cho sinh viên đại học có kiến thức nền.

**🎯 MỤC TIÊU: Tạo ra bản cập nhật chi tiết nhất, dài nhất và giàu thông tin nhất về các phát triển mới trong "{topic}"**
"""
    else:
        enhanced_update_prompt = f"""
You are a leading expert on **"{topic}"**. Your task is to update the existing knowledge base with **EXTREMELY DETAILED AND LATEST** information.

**Current content (SUMMARY):**
--- START SUMMARY ---
{previous_summary}
--- END SUMMARY ---

---

### 🔄 COMPREHENSIVE AND DETAILED UPDATE

#### 📈 1. LATEST DEVELOPMENTS (8-12 developments)
**Requirement: At least 8-12 new developments (last 3 years) NOT in the summary:**
- **Deep analysis** from reference sources (specific details)
- **Connection with existing knowledge** to show progression
- **Specific case studies, data, frameworks** with real examples
- **Multi-dimensional impact** on field, industry, society
- **New research trends** with methodology and findings

#### 🔬 2. BREAKTHROUGH RESEARCH AND INNOVATION (6-8 studies)
- **Game-changing research** from the last 2-3 years
- **New methods and breakthrough technologies**
- **Unexpected results and paradigm shifts**
- **Unexplored application potentials**

#### 🌐 3. GLOBAL SITUATION AND COMPARISON (5-7 regions)
- **Different approaches comparison** across continents/countries
- **Success stories and failure cases** from different markets
- **Cultural and regulatory differences** and their impact
- **Global collaboration and challenges**

#### ⚡ 4. NEW CHALLENGES AND EMERGING ISSUES (6-8 challenges)
- **Newly emerged problems** not previously mentioned
- **Ethical and social implications** of new developments
- **Technical bottlenecks and solutions** being explored
- **Future risks and mitigation strategies**

#### 🔮 5. PREDICTIONS AND FUTURE ROADMAP (5-10 years)
- **Evidence-based predictions** based on current trends
- **Technology convergence** and synergy effects
- **Market opportunities and potential disruptions**
- **Skills gap and education needs**

#### 💼 6. NEW PRACTICAL IMPLICATIONS (8-10 applications)
- **New use cases and applications** not yet mainstream
- **Implementation strategies** with lessons learned
- **ROI and cost-benefit analysis** from real deployments
- **New best practices emerged** from industry leaders

#### 📊 7. NEW DATA AND METRICS
- **Key performance indicators** being tracked
- **New benchmarks and standards**
- **Measurement methodologies** being developed
- **Comparative analysis** with historical data

#### 📝 8. UPDATE SUMMARY
**12-15 main points** from the update:
- **Novelty and significance** of each insight
- **Connection with existing knowledge base**
- **Actionable takeaways** for practitioners and researchers

#### 🔗 9. New References
{references_text}

---

#### 🔗 NEW REFERENCES (MUST USE ALL)
{references_text}

---

### 🛠 TECHNICAL REQUIREMENTS FOR UPDATE

**Maximize length and detail:**
- **Each section minimum 1000-1500 words**
- **No overall length limit**
- **Specific details with examples, numbers, names**

**Quality assurance:**
- **Avoid repetition** with existing summary
- **Deep analysis** instead of surface-level description  
- **Multi-perspective coverage** of each topic
- **Evidence-based claims** with proper citations

**Citations requirements:**
- **Integrate at least 2 insights from each reference**
- Natural phrasing: *"According to [title]..."*, *"Research from [title] indicates..."*
- **Combine reference insights with expert knowledge**
- **MUST NOT ignore or replace provided references**

**Markdown formatting:**
- `####` for main sections, `#####` for subsections
- **Bold** for key terms, *italics* for emphasis
- Bullet points, tables, diagrams when appropriate
- Clear spacing and paragraph structure

Write all content in English using formal academic language suitable for university students with background knowledge.

**🎯 OBJECTIVE: Create the most detailed, longest and information-rich update about new developments in "{topic}"**
"""

    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    try:
        response = model.generate_content(
            enhanced_update_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=32768,
                temperature=0.2,
            )
        )
        return response.text.strip()
        
    except Exception as e:
        return generate_simple_update(topic, previous_summary, valid_references, language)

def generate_simple_update(topic: str, previous_summary: str, references: List[Tuple[str, str]], language: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
    
    refs_text = "\n".join([f"- [{title}]({url})" for title, url in references])
    
    if language == "vi":
        simple_prompt = f"""
        Cập nhật thông tin cho chủ đề "{topic}" dựa trên:
        
        Tóm tắt hiện tại: {previous_summary[:2000]}...
        
        Nguồn mới: {refs_text}
        
        Tạo nội dung cập nhật chi tiết với 5-7 phát triển mới, mỗi phát triển 300-500 từ.
        Ngôn ngữ: tiếng Việt
        """
    else:
        simple_prompt = f"""
        Update information for topic "{topic}" based on:
        
        Current summary: {previous_summary[:2000]}...
        
        New sources: {refs_text}
        
        Create detailed update content with 5-7 new developments, each development 300-500 words.
        Language: English
        """
    
    try:
        response = model.generate_content(
            simple_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=16384,
                temperature=0.3,
            )
        )
        return response.text.strip()
    except:
        if language == "vi":
            return "## 🔄 Cập nhật\n\nĐang cập nhật thông tin mới nhất..."
        else:
            return "## 🔄 Update\n\nUpdating latest information..."

def generate_content_with_retries(topic: str, language: str = "en", max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            references = get_enhanced_references(topic, max_results=15)
            valid_references = [ref for ref in references if ref[0] and ref[1]][:10]
            
            if len(valid_references) < 3:
                valid_references = references[:3]
            
            initial_content = generate_professor_content(topic, language)
            
            
            return initial_content
            
        except Exception as e:
            if attempt == max_retries - 1:
                return generate_basic_fallback_content(topic, language)
            
            time.sleep(5)
    
    return generate_basic_fallback_content(topic, language)

def generate_basic_fallback_content(topic: str, language: str) -> str:
    if language == "vi":
        lang_content = f"""
## Cơ sở tri thức: {topic}

### Giới thiệu
Nội dung về {topic} đang được cập nhật. Vui lòng thử lại sau.

### Thông tin cơ bản
Chủ đề này đang được nghiên cứu và phát triển nội dung chi tiết.

### Tài liệu tham khảo
Các nguồn tham khảo sẽ được bổ sung trong phiên bản cập nhật tiếp theo.
"""
    else:
        lang_content = f"""
## Knowledge Base: {topic}

### Introduction
Content about {topic} is being updated. Please try again later.

### Basic Information
This topic is being researched and detailed content is being developed.

### References
Reference sources will be added in the next update.
"""
    return lang_content

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
                
                if use_enhanced_generation:
                    update_content = generate_professor_update(topic, previous_summary, language)
                else:
                    references = search_serpapi_links(topic, is_update=True, max_results=5)
                    new_references = [
                        (title, url) for title, url in references
                        if title and url and not is_course_link(url)
                    ][:2]
                    
                    if len(new_references) != 2:
                        return Response(
                            {"error": "Insufficient valid references for update"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    update_content = generate_professor_update(topic, previous_summary, language)
                
                update_google_doc(doc_url, update_content, creds)
                
                return Response({
                    "message": "Document updated successfully with enhanced content.",
                    "doc_url": doc_url,
                    "content_stats": {
                        "word_count": len(update_content.split()),
                        "enhanced_generation": use_enhanced_generation
                    }
                })

            else:
                
                if use_enhanced_generation:
                    content = generate_content_with_retries(topic, language)
                else:
                    content = generate_professor_content(topic, language)

                if language == "vi":
                    doc_title = f"📘 Cơ sở Tri thức - {topic}"
                else:
                    doc_title = f"📘 Knowledge Base - {topic}"
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
                    "message": "Enhanced document created successfully.",
                    "doc_url": doc_url,
                    "content_stats": {
                        "word_count": len(content.split()),
                        "enhanced_generation": use_enhanced_generation
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