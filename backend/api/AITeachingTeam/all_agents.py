from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from userauths.models import User
from google.oauth2 import service_account
from django.conf import settings
from api.AITeachingTeam.utils import search_serpapi_links, create_google_doc
from api.AITeachingTeam.views_professor import generate_professor_content
from api.AITeachingTeam.views_academic_advisor import generate_advisor_content
from api.AITeachingTeam.views_research_librarian import generate_librarian_content
from api.AITeachingTeam.views_teaching_assistant import generate_assistant_content
from api import models as api_models
from django.db.models import Q

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
GEMINI_API_KEY = settings.GEMINI_API_KEY
SERPAPI_KEY = settings.SERPAPI_KEY

class RunAllAgentsAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            if not all([hasattr(settings, attr) for attr in ['CREDENTIALS_FILE', 'GEMINI_API_KEY', 'SERPAPI_KEY']]):
                return Response({"error": "Missing API configuration"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            topic = request.data.get("topic")
            user_id = request.data.get("user_id")
            study_duration = request.data.get("study_duration", "")
            language = request.data.get("language", "en")

            if not topic or not user_id:
                return Response({"error": "Missing topic or user_id"}, status=status.HTTP_400_BAD_REQUEST)

            SUPPORTED_LANGUAGES = ["en", "vi"]
            if language not in SUPPORTED_LANGUAGES:
                return Response({"error": f"Language {language} not supported"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.get(id=user_id)
            creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            references = search_serpapi_links(topic)

            # 1. Professor
            professor_content = generate_professor_content(topic, references, language)
            professor_doc_url = create_google_doc(f"📘 Knowledge Base - {topic}", professor_content, creds, user.email)
            api_models.UserDocument.objects.create(user=user, topic=topic, doc_url=professor_doc_url, ai_type="professor")

            # 2. Academic Advisor
            advisor_content = generate_advisor_content(topic, professor_content, study_duration, references, language)
            advisor_doc_url = create_google_doc(f"🗺️ Learning Roadmap - {topic}", advisor_content, creds, user.email)
            api_models.UserDocument.objects.create(user=user, topic=topic, doc_url=advisor_doc_url, ai_type="advisor")

            # 3. Research Librarian
            related_courses = list(api_models.Course.objects.filter(
                Q(title__icontains=topic) | Q(description__icontains=topic)
            ).values("title", "description", "slug", "price", "certificate")[:5])
            skip_online_section = len(related_courses) > 0
            librarian_content = generate_librarian_content(topic, references, language, skip_online_section)
            if related_courses:
                internal_courses_text = "### 5. Online Courses\n"
                for course in related_courses:
                    internal_courses_text += (
                        f"- **{course['title']}**\n"
                        f"  - Platform: Internal LMS\n"
                        f"  - What’s covered: {course['description'][:100]}...\n"
                        f"  - Cost: {'Free' if course['price'] == 0 else f'{course['price']} USD'}\n"
                        f"  - Certification available: {'Yes' if course['certificate'] else 'No'}\n"
                        f"  - [View Course](/courses/{course['slug']})\n\n"
                    )
                librarian_content += f"\n{internal_courses_text}"
            librarian_doc_url = create_google_doc(f"📚 Research Resources - {topic}", librarian_content, creds, user.email)
            api_models.UserDocument.objects.create(user=user, topic=topic, doc_url=librarian_doc_url, ai_type="librarian")

            # 4. Teaching Assistant
            assistant_content = generate_assistant_content(topic, references, professor_content, language)
            assistant_doc_url = create_google_doc(f"✍️ Practice Materials - {topic}", assistant_content, creds, user.email)
            api_models.UserDocument.objects.create(user=user, topic=topic, doc_url=assistant_doc_url, ai_type="assistant")

            return Response({
                "message": "All documents created successfully.",
                "documents": {
                    "professor": professor_doc_url,
                    "advisor": advisor_doc_url,
                    "librarian": librarian_doc_url,
                    "assistant": assistant_doc_url
                }
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)