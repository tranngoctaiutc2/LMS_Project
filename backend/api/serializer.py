from django.contrib.auth.password_validation import validate_password
from api import models as api_models

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from userauths.models import Profile, User
from moviepy.editor import VideoFileClip
import datetime
import json
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['full_name'] = user.full_name
        token['email'] = user.email
        token['username'] = user.username
        try:
            token['teacher_id'] = user.teacher.id
        except:
            token['teacher_id'] = 0


        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'password2']

    def validate(self, attr):
        if attr['password'] != attr['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attr
    
    def create(self, validated_data):
        user = User.objects.create(
            full_name=validated_data['full_name'],
            email=validated_data['email'],
        )

        email_username, _ = user.email.split("@")
        user.username = email_username
        user.set_password(validated_data['password'])
        user.save()

        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        fields = ['id', 'title', 'image', 'slug', 'course_count']
        model = api_models.Category

class TeacherSerializer(serializers.ModelSerializer):

    class Meta:
        fields = [ "user", "image", "full_name", "bio", "facebook", "twitter", "linkedin", "about", "country", "students", "courses", "review",]
        model = api_models.Teacher

class VariantItemSerializer(serializers.ModelSerializer):
    
    class Meta:
        fields = '__all__'
        model = api_models.VariantItem

    
    def __init__(self, *args, **kwargs):
        super(VariantItemSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class VariantSerializer(serializers.ModelSerializer):
    items = VariantItemSerializer(many=True)
    class Meta:
        fields = '__all__'
        model = api_models.Variant

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        variant = api_models.Variant.objects.create(**validated_data)
        for item_data in items_data:
            api_models.VariantItem.objects.create(variant=variant, **item_data)
        return variant

    def __init__(self, *args, **kwargs):
        super(VariantSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class Question_Answer_MessageSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(many=False)
    course_name = serializers.CharField(source='course.title')

    class Meta:
        fields = '__all__'
        model = api_models.Question_Answer_Message

class Question_AnswerSerializer(serializers.ModelSerializer):
    messages = Question_Answer_MessageSerializer(many=True)
    profile = ProfileSerializer(many=False)
    
    class Meta:
        fields = '__all__'
        model = api_models.Question_Answer


class CartSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Cart

    def __init__(self, *args, **kwargs):
        super(CartSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CartOrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.CartOrderItem

    def __init__(self, *args, **kwargs):
        super(CartOrderItemSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3


class CartOrderSerializer(serializers.ModelSerializer):
    order_items = CartOrderItemSerializer(many=True)
    
    class Meta:
        fields = '__all__'
        model = api_models.CartOrder


    def __init__(self, *args, **kwargs):
        super(CartOrderSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CertificateSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Certificate



class CompletedLessonSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.CompletedLesson


    def __init__(self, *args, **kwargs):
        super(CompletedLessonSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class NoteSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Note



class ReviewSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(many=False)

    class Meta:
        fields = '__all__'
        model = api_models.Review

    def __init__(self, *args, **kwargs):
        super(ReviewSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Notification


class CouponSerializer(serializers.ModelSerializer):
    used_by = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = api_models.Coupon
        fields = '__all__'

    def validate_code(self, value):
        instance = self.instance
        if instance is None:
            if api_models.Coupon.objects.filter(code=value).exists():
                raise serializers.ValidationError("Code has already exist.")
        else:
            if api_models.Coupon.objects.filter(code=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Code has already exist.")
        return value

    def validate_discount(self, value):
        if not 1 <= value <= 100:
            raise serializers.ValidationError("Discount have 1 to 100.")
        return value

    def validate(self, data):
        date = data.get('date')
        end_date = data.get('end_date')
        if date and end_date and end_date < date:
            raise serializers.ValidationError({"end_date": "Error date end."})
        return data


class WishlistSerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Wishlist

    def __init__(self, *args, **kwargs):
        super(WishlistSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CountrySerializer(serializers.ModelSerializer):

    class Meta:
        fields = '__all__'
        model = api_models.Country




class EnrolledCourseSerializer(serializers.ModelSerializer):
    lectures = VariantItemSerializer(many=True, read_only=True)
    completed_lesson = CompletedLessonSerializer(many=True, read_only=True)
    curriculum =  VariantSerializer(many=True, read_only=True)
    note = NoteSerializer(many=True, read_only=True)
    question_answer = Question_AnswerSerializer(many=True, read_only=True)
    review = ReviewSerializer(many=False, read_only=True)


    class Meta:
        fields = '__all__'
        model = api_models.EnrolledCourse

    def __init__(self, *args, **kwargs):
        super(EnrolledCourseSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

class CourseSerializer(serializers.ModelSerializer):
    students = EnrolledCourseSerializer(many=True, required=False, read_only=True)
    variants = VariantSerializer(many=True, required=False)
    lectures = VariantItemSerializer(many=True, required=False, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True, required=False)

    class Meta:
        model = api_models.Course
        fields = [
            "id", "category", "teacher", "file", "image", "title", "description",
            "price", "language", "level", "platform_status", "teacher_course_status",
            "featured", "course_id", "slug", "date", "students", "variants",
            "lectures", "average_rating", "rating_count", "reviews"
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        variants_data = validated_data.pop('variants', None)

        if variants_data is None and request:
            raw_variants = request.data.get("variants")
            if raw_variants:
                try:
                    variants_data = json.loads(raw_variants)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({"variants": "Invalid JSON format."})
            else:
                variants_data = []

        course = api_models.Course.objects.create(**validated_data)

        for variant_data in variants_data:
            items_data = variant_data.pop('items', [])
            variant = api_models.Variant.objects.create(course=course, **variant_data)

            for item_data in items_data:
                file_url = item_data.get("file")
                duration = None
                content_duration = None

                if file_url:
                    try:
                        clip = VideoFileClip(file_url)
                        total_seconds = int(clip.duration)
                        duration = datetime.timedelta(seconds=total_seconds)
                        minutes, seconds = divmod(total_seconds, 60)
                        hours, minutes = divmod(minutes, 60)
                        content_duration = f"{hours:02}:{minutes:02}:{seconds:02}"
                        clip.close()
                    except Exception:
                        pass

                api_models.VariantItem.objects.create(
                    variant=variant,
                    title=item_data.get("title"),
                    description=item_data.get("description"),
                    file=file_url,
                    preview=item_data.get("preview", False),
                    duration=duration,
                    content_duration=content_duration
                )

        return course

    def update(self, instance, validated_data):
        request = self.context.get("request")
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        variants_data = validated_data.pop('variants', None)

        if variants_data is None and request:
            raw_variants = request.data.get("variants")
            if raw_variants:
                try:
                    variants_data = json.loads(raw_variants)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({"variants": "Invalid JSON format."})
            else:
                variants_data = []

        if variants_data is not None:
            for variant_data in variants_data:
                items_data = variant_data.pop('items', [])

                variant_id = variant_data.get('variant_id')
                if variant_id:
                    variant = instance.variants.filter(variant_id=variant_id).first()
                    if not variant:
                        raise serializers.ValidationError({"variant_id": f"Variant {variant_id} not found"})
                    for attr, val in variant_data.items():
                        setattr(variant, attr, val)
                    variant.save()
                else:
                    variant = api_models.Variant.objects.create(course=instance, **variant_data)

                for item_data in items_data:
                    item_id = item_data.get('variant_item_id')
                    file_url = item_data.get("file")
                    duration = None
                    content_duration = None

                    if file_url:
                        try:
                            clip = VideoFileClip(file_url)
                            total_seconds = int(clip.duration)
                            duration = datetime.timedelta(seconds=total_seconds)
                            minutes, seconds = divmod(total_seconds, 60)
                            hours, minutes = divmod(minutes, 60)
                            content_duration = f"{hours:02}:{minutes:02}:{seconds:02}"
                            clip.close()
                        except Exception:
                            pass

                    if item_id:
                        item = variant.items.filter(variant_item_id=item_id).first()
                        if not item:
                            raise serializers.ValidationError({"variant_item_id": f"Item {item_id} not found"})
                        item.title = item_data.get("title", item.title)
                        item.description = item_data.get("description", item.description)
                        item.file = file_url or item.file
                        item.preview = item_data.get("preview", item.preview)
                        item.duration = duration
                        item.content_duration = content_duration
                        item.save()
                    else:
                        api_models.VariantItem.objects.create(
                            variant=variant,
                            title=item_data.get("title"),
                            description=item_data.get("description"),
                            file=file_url,
                            preview=item_data.get("preview", False),
                            duration=duration,
                            content_duration=content_duration
                        )

        return instance


    def __init__(self, *args, **kwargs):
        super(CourseSerializer, self).__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.method == "POST":
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3






class StudentSummarySerializer(serializers.Serializer):
    total_courses = serializers.IntegerField(default=0)
    completed_lessons = serializers.IntegerField(default=0)
    achieved_certificates = serializers.IntegerField(default=0)

class TeacherSummarySerializer(serializers.Serializer):
    total_courses = serializers.IntegerField(default=0)
    total_students = serializers.IntegerField(default=0)
    total_revenue = serializers.IntegerField(default=0)
    monthly_revenue = serializers.IntegerField(default=0)




class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)


