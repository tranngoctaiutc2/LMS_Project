from api import views as api_views
from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView
from api.AITeachingTeam.views_professor import ProfessorAgentAPIView
from api.AITeachingTeam.views_academic_advisor import AcademicAdvisorAgentAPIView
from api.AITeachingTeam.views_research_librarian import ResearchLibrarianAgentAPIView
from api.AITeachingTeam.views_teaching_assistant import TeachingAssistantAgentAPIView
from api.AITeachingTeam.all_agents import RunAllAgentsAPIView
from api.AITeachingTeam.views_check_global_topic import CheckGlobalTopicAPIView

urlpatterns = [

    # Authentication Endpoints
    path("user/token/", api_views.MyTokenObtainPairView.as_view()),
    path("user/token/refresh/", TokenRefreshView.as_view()),
    path("user/register/", api_views.RegisterView.as_view()),
    path("user/password-reset/<email>/", api_views.PasswordResetEmailVerifyAPIView.as_view()),
    path("user/password-change/", api_views.PasswordChangeAPIView.as_view()),
    path("user/profile/<user_id>/", api_views.ProfileAPIView.as_view()),
    path("user/change-password/", api_views.ChangePasswordAPIView.as_view()),
    path("clerk/login/", api_views.clerk_login),

    # Core Endpoints
    path("course/category/", api_views.CategoryListAPIView.as_view()),
    path("course/course-list/", api_views.CourseListAPIView.as_view()),
    path("course/search/", api_views.SearchCourseAPIView.as_view()),
    path("course/course-detail/<slug>/", api_views.CourseDetailAPIView.as_view()),
    path("course/cart/", api_views.CartAPIView.as_view()),
    path("course/cart-list/<cart_id>/", api_views.CartListAPIView.as_view()),
    path("cart/stats/<cart_id>/", api_views.CartStatsAPIView.as_view()),
    path("course/cart-item-delete/<cart_id>/", api_views.CartItemDeleteAPIView.as_view()),
    path("course/cart-item-delete/<cart_id>/<item_id>/", api_views.CartItemDeleteAPIView.as_view()),
    path("order/create-order/", api_views.CreateOrderAPIView.as_view()),
    path("order/checkout/<oid>/", api_views.CheckoutAPIView.as_view()),
    path("order/coupon/", api_views.CouponApplyAPIView.as_view()),
    path("payment/vnpay-checkout/<order_oid>/", api_views.VNPayCheckoutAPIView.as_view()),
    path("payment/payment-success/", api_views.PaymentSuccessAPIView.as_view()),


    # Student API Endpoints
    path("student/summary/<user_id>/", api_views.StudentSummaryAPIView.as_view()),
    path("student/course-list/<user_id>/", api_views.StudentCourseListAPIView.as_view()),
    path("student/course-detail/<user_id>/<enrollment_id>/", api_views.StudentCourseDetailAPIView.as_view()),
    path("student/course-completed/", api_views.StudentCourseCompletedCreateAPIView.as_view()),
    path("student/course-note/<user_id>/<enrollment_id>/", api_views.StudentNoteCreateAPIView.as_view()),
    path("student/course-note-detail/<user_id>/<enrollment_id>/<note_id>/", api_views.StudentNoteDetailAPIView.as_view()),
    path("student/rate-course/", api_views.StudentRateCourseCreateAPIView.as_view()),
    path("student/review-detail/<user_id>/<review_id>/", api_views.StudentRateCourseUpdateAPIView.as_view()),
    path("student/wishlist/<user_id>/", api_views.StudentWishListListCreateAPIView.as_view()),
    path("student/question-answer-list-create/<user_id>/", api_views.QuestionAnswerListCreateAPIView.as_view()),
    path("student/question-answer-message-create/", api_views.QuestionAnswerMessageSendAPIView.as_view()),


    # Teacher Routes
    path("teacher/summary/<teacher_id>/", api_views.TeacherSummaryAPIView.as_view()),
    path("teacher/course-lists/<teacher_id>/", api_views.TeacherCourseListAPIView.as_view()),
    path("teacher/review-lists/<teacher_id>/", api_views.TeacherReviewListAPIView.as_view()),
    path("teacher/review-detail/<teacher_id>/<review_id>/", api_views.TeacherReviewDetailAPIView.as_view()),
    path("teacher/student-lists/<teacher_id>/", api_views.TeacherStudentsListAPIVIew.as_view({'get': 'list'})),
    path("teacher/all-months-earning/<teacher_id>/", api_views.TeacherAllMonthEarningAPIView),
    path("teacher/best-course-earning/<teacher_id>/", api_views.TeacherBestSellingCourseAPIView.as_view({'get': 'list'})),
    path("teacher/course-order-list/<teacher_id>/", api_views.TeacherCourseOrdersListAPIView.as_view()),
    path("teacher/question-answer-list/<teacher_id>/", api_views.TeacherQuestionAnswerListAPIView.as_view()),
    path("teacher/coupon-list/<teacher_id>/", api_views.TeacherCouponListCreateAPIView.as_view()),
    path("teacher/coupon-detail/<teacher_id>/<coupon_id>/", api_views.TeacherCouponDetailAPIView.as_view()),
    path("teacher/noti-list/<teacher_id>/", api_views.TeacherNotificationListAPIView.as_view()),
    path("teacher/noti-detail/<teacher_id>/<noti_id>", api_views.TeacherNotificationDetailAPIView.as_view()),
    path("teacher/course-create/", api_views.TeacherCourseCreateAPIView.as_view()),
    path("teacher/course-update/<teacher_id>/<course_id>/", api_views.TeacherCourseUpdateAPIView.as_view()),
    path("teacher/course-delete/<teacher_id>/<course_id>/", api_views.TeacherCourseDeleteAPIView.as_view()),
    path("teacher/course-detail/<course_id>/", api_views.TeacherCourseDetailAPIView.as_view()),
    path("teacher/course/variant-delete/<variant_id>/<teacher_id>/<course_id>/", api_views.CourseVariantDeleteAPIView.as_view()),
    path("teacher/course/variant-item-delete/<variant_id>/<variant_item_id>/<teacher_id>/<course_id>/", api_views.CourseVariantItemDeleteAPIVIew.as_view()),

    path('teacher/register/', api_views.TeacherRegistrationView.as_view()),
    path('teacher/profile/', api_views.TeacherProfileView.as_view()),
    path('teacher/status/', api_views.check_teacher_status),


    path("file-upload/", api_views.FileUploadAPIView.as_view()),
    path('top-reviews/', api_views.TopReviewsView.as_view()),

    path('chat/', api_views.ChatBotAPIView.as_view()),
    path('chat/history/', api_views.GetChatHistoryAPIView.as_view()),
    path('chat/delete/', api_views.DeleteChatHistoryAPIView.as_view()),

    path('ai-document-list/', api_views.UserDocumentListView.as_view()),
    path("professor-agent/", ProfessorAgentAPIView.as_view()),
    path("academic-advisor-agent/", AcademicAdvisorAgentAPIView.as_view()),
    path("research-librarian-agent/", ResearchLibrarianAgentAPIView.as_view()),
    path("teaching-assistant-agent/", TeachingAssistantAgentAPIView.as_view()),
    path("all-agent/", RunAllAgentsAPIView.as_view()),
    path("check-global-topic/", CheckGlobalTopicAPIView.as_view()),
]


