import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import Swal from "sweetalert2";

function CourseEdit() {
    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        image: "",
        file: "",
        level: "",
        language: "",
        price: "",
        category: "",
    });
    const [imagePreview, setImagePreview] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [isFileLoading, setFileLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const { course_id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoryRes, courseRes] = await Promise.all([
                    useAxios.get(`course/category/`),
                    useAxios.get(`teacher/course-detail/${course_id}/`),
                ]);
                setCategories(categoryRes.data);
                setCourseData({
                    title: courseRes.data.title || "",
                    description: courseRes.data.description || "",
                    image: courseRes.data.image || "",
                    file: courseRes.data.file || "",
                    level: courseRes.data.level || "",
                    language: courseRes.data.language || "",
                    price: courseRes.data.price ? String(Number(courseRes.data.price).toFixed(2)) : "",
                    category: courseRes.data.category?.id || "",
                });
                setImagePreview(courseRes.data.image || "");
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load data!",
                });
            }
        };
        fetchData();
    }, [course_id]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await useAxios.post("/file-upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response?.data?.url) {
                setImagePreview(response.data.url);
                setCourseData({ ...courseData, image: response.data.url });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to upload image!",
            });
        }
        setLoading(false);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setFileLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await useAxios.post("/file-upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response?.data?.url) {
                setCourseData({ ...courseData, file: response.data.url });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to upload video!",
            });
        }
        setFileLoading(false);
    };

    const handleCourseInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = name === "price" ? (value ? String(Number(value).toFixed(2)) : "") : value;
        setCourseData({ ...courseData, [name]: type === "checkbox" ? checked : finalValue });
    };

    const validateForm = () => {
        const errors = {};
        if (!courseData.title || courseData.title.length > 60) errors.title = "Title is required, max 60 characters.";
        if (!courseData.category || isNaN(Number(courseData.category))) errors.category = "Select a valid category.";
        if (!courseData.level) errors.level = "Select a level.";
        if (!courseData.language) errors.language = "Select a language.";
        if (!courseData.price || !/^\d+\.\d{2}$/.test(courseData.price)) errors.price = "Price must be like 99.99.";
        if (!courseData.description) errors.description = "Description is required.";
        if (Object.keys(errors).length > 0) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Please fill all required fields!",
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", courseData.title);
            formData.append("description", courseData.description);
            if (courseData.image) formData.append("image", courseData.image);
            if (courseData.file) formData.append("file", courseData.file);
            formData.append("level", courseData.level);
            formData.append("language", courseData.language);
            formData.append("price", courseData.price);
            formData.append("category", courseData.category);

            const response = await useAxios.put(`teacher/course-update/${course_id}/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
                icon: "success",
                title: "Course Updated Successfully",
            });
            navigate(`/instructor/edit-course/${course_id}/`);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Failed to Update Course",
                text: error.response?.data ? JSON.stringify(error.response.data) : "Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <BaseHeader />
            <section className="pt-5 pb-5">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <form className="col-lg-9 col-md-8 col-12" onSubmit={handleSubmit}>
                            <section className="pb-8 mt-5">
                                <div className="card mb-3">
                                    <div className="card-header border-bottom px-4 py-3">
                                        <h4 className="mb-0">Basic Information</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Thumbnail Preview</label>
                                            <img
                                                style={{ width: "100%", height: "330px", objectFit: "cover", borderRadius: "10px" }}
                                                className="mb-4"
                                                src={imagePreview || "https://www.eclosio.ong/wp-content/uploads/2018/08/default.png"}
                                                alt="Thumbnail Preview"
                                            />
                                            <input
                                                className="form-control"
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isLoading}
                                            />
                                            {isLoading && <p className="text-muted">Uploading image...</p>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Intro Video</label>
                                            <input
                                                className="form-control"
                                                type="file"
                                                name="file"
                                                accept="video/*"
                                                onChange={handleFileUpload}
                                                disabled={isFileLoading}
                                            />
                                            {isFileLoading && <p className="text-muted">Uploading video...</p>}
                                            {courseData.file && (
                                                <p>
                                                    <a href={courseData.file} target="_blank" rel="noopener noreferrer">
                                                        Preview Video
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Title</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="title"
                                                value={courseData.title}
                                                onChange={handleCourseInputChange}
                                                maxLength="60"
                                            />
                                            <small>Max 60 characters.</small>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Category</label>
                                            <select
                                                className="form-select"
                                                name="category"
                                                value={courseData.category}
                                                onChange={handleCourseInputChange}
                                            >
                                                <option value="">Select category</option>
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Level</label>
                                            <select
                                                className="form-select"
                                                name="level"
                                                value={courseData.level}
                                                onChange={handleCourseInputChange}
                                            >
                                                <option value="">Select level</option>
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Language</label>
                                            <select
                                                className="form-select"
                                                name="language"
                                                value={courseData.language}
                                                onChange={handleCourseInputChange}
                                            >
                                                <option value="">Select language</option>
                                                <option value="English">English</option>
                                                <option value="Vietnamese">Vietnamese</option>
                                                <option value="Spanish">Spanish</option>
                                                <option value="French">French</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <CKEditor
                                                editor={ClassicEditor}
                                                data={courseData.description}
                                                onChange={(event, editor) => {
                                                    setCourseData({ ...courseData, description: editor.getData() });
                                                }}
                                                config={{
                                                    toolbar: ["bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "undo", "redo"],
                                                }}
                                            />
                                            <small>Brief course summary.</small>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Price ($)</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                name="price"
                                                value={courseData.price}
                                                onChange={handleCourseInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="99.99"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <Link to={`/instructor/edit-course/${course_id}/curriculum/`} className="btn btn-primary">
                                        Manage Curriculum <i className="fas fa-arrow-right ms-2"></i>
                                    </Link>
                                    <button
                                        className="btn btn-lg btn-success w-100 mt-2"
                                        type="submit"
                                        disabled={isSubmitting || isLoading || isFileLoading}
                                    >
                                        {isSubmitting ? "Updating..." : "Update Course"} <i className="fas fa-check-circle"></i>
                                    </button>
                                </div>
                            </section>
                        </form>
                    </div>
                </div>
            </section>
            <BaseFooter />
        </>
    );
}

export default CourseEdit;