import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { Link, useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import Swal from "sweetalert2";
import { teacherId } from "../../utils/constants";

function CourseCreate() {
    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        image: null,
        file: "",
        level: "Beginner",
        language: "English",
        price: "",
        category: "",
        teacher_course_status: "Published",
        featured: false,
        variants: [],
    });
    const [imagePreview, setImagePreview] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState({ image: false, file: false });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        useAxios
            .get(`course/category/`)
            .then((res) => setCategories(res.data))
            .catch(() =>
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load categories!",
                })
            );
    }, []);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setCourseData({ ...courseData, image: file });
        setErrors((prev) => ({ ...prev, image: "" }));
    };

    const handleFileUpload = async (event, variantIndex = null, itemIndex = null) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ["video/mp4", "video/avi", "video/mov"];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                [variantIndex !== null ? `item_${variantIndex}_${itemIndex}_file` : "file"]: "Please select a valid video file.",
            }));
            return;
        }

        setLoading((prev) => ({ ...prev, file: true }));
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await useAxios.post("/file-upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response?.data?.url) {
                if (variantIndex !== null && itemIndex !== null) {
                    setCourseData((prev) => {
                        const newVariants = [...prev.variants];
                        newVariants[variantIndex].items[itemIndex].file = response.data.url;
                        return { ...prev, variants: newVariants };
                    });
                    setErrors((prev) => ({
                        ...prev,
                        [`item_${variantIndex}_${itemIndex}_file`]: "",
                    }));
                } else {
                    setCourseData((prev) => ({ ...prev, file: response.data.url }));
                    setErrors((prev) => ({ ...prev, file: "" }));
                }
            }
        } catch (error) {
            setErrors((prev) => ({
                ...prev,
                [variantIndex !== null ? `item_${variantIndex}_${itemIndex}_file` : "file"]: "Error uploading file.",
            }));
        }
        setLoading((prev) => ({ ...prev, file: false }));
    };

    const handleCourseInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = name === "price" ? (value ? String(Number(value).toFixed(2)) : "") : value;
        setCourseData({ ...courseData, [name]: type === "checkbox" ? checked : finalValue });
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleVariantChange = (index, field, value) => {
        setCourseData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[index][field] = value;
            return { ...prev, variants: newVariants };
        });
        setErrors((prev) => ({ ...prev, [`variant_${index}_${field}`]: "" }));
    };

    const handleItemChange = (variantIndex, itemIndex, field, value) => {
        setCourseData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[variantIndex].items[itemIndex][field] = value;
            return { ...prev, variants: newVariants };
        });
        setErrors((prev) => ({ ...prev, [`item_${variantIndex}_${itemIndex}_${field}`]: "" }));
    };

    const addVariant = () => {
        setCourseData((prev) => ({
            ...prev,
            variants: [...prev.variants, { title: "", items: [] }],
        }));
    };

    const addItem = (variantIndex) => {
        setCourseData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[variantIndex].items.push({
                title: "",
                description: "",
                file: "",
                preview: false,
            });
            return { ...prev, variants: newVariants };
        });
    };

    const removeVariant = (index) => {
        setCourseData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }));
    };

    const removeItem = (variantIndex, itemIndex) => {
        setCourseData((prev) => {
            if (
                variantIndex < 0 ||
                variantIndex >= prev.variants.length ||
                itemIndex < 0 ||
                itemIndex >= prev.variants[variantIndex].items.length
            ) {
                return prev;
            }
            const newVariants = [...prev.variants];
            newVariants[variantIndex].items = newVariants[variantIndex].items.filter((_, i) => i !== itemIndex);
            return { ...prev, variants: newVariants };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!courseData.title || courseData.title.length > 60) newErrors.title = "Title is required, max 60 characters.";
        if (!courseData.category || isNaN(Number(courseData.category))) newErrors.category = "Select a valid category.";
        if (!courseData.level) newErrors.level = "Select a level.";
        if (!courseData.language) newErrors.language = "Select a language.";
        if (!courseData.price || !/^\d+\.\d{2}$/.test(courseData.price)) newErrors.price = "Price must be like 99.99.";
        if (!courseData.description) newErrors.description = "Description is required.";
        if (!courseData.teacher_course_status) newErrors.teacher_course_status = "Select a course status.";
        if (courseData.variants.length === 0) newErrors.variants = "At least one module is required.";
        courseData.variants.forEach((variant, i) => {
            if (!variant.title) newErrors[`variant_${i}_title`] = "Module title is required.";
            if (variant.items.length === 0) newErrors[`variant_${i}_items`] = "At least one lesson is required.";
            variant.items.forEach((item, j) => {
                if (!item.title) newErrors[`item_${i}_${j}_title`] = "Lesson title is required.";
                if (!item.file) newErrors[`item_${i}_${j}_file`] = "Lesson video is required.";
                if (item.file && !item.file.startsWith("http")) newErrors[`item_${i}_${j}_file`] = "Invalid video URL.";
            });
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Please fill all required fields!",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", courseData.title);
            formData.append("description", courseData.description);
            if (courseData.image instanceof File) formData.append("image", courseData.image);
            if (typeof courseData.file === "string" && courseData.file) formData.append("file", courseData.file);
            formData.append("level", courseData.level);
            formData.append("language", courseData.language);
            formData.append("price", courseData.price);
            formData.append("category", courseData.category);
            formData.append("teacher", teacherId);
            formData.append("teacher_course_status", courseData.teacher_course_status);
            formData.append("featured", courseData.featured);
            formData.append("platform_status", "Published");
            formData.append("variants", JSON.stringify(courseData.variants));

            const response = await useAxios.post(`/teacher/course-create/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });

            Swal.fire({
                icon: "success",
                title: "Course Created Successfully",
            });
            navigate(`/instructor/edit-course/${response?.data?.course_id}/`);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Failed to Create Course",
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
                            <section className="py-4 py-lg-6 bg-primary rounded-3">
                                <div className="container">
                                    <div className="row">
                                        <div className="offset-lg-1 col-lg-10 col-md-12 col-12">
                                            <div className="d-lg-flex align-items-center justify-content-between">
                                                <div className="mb-4 mb-lg-0">
                                                    <h1 className="text-white mb-1">Add New Course</h1>
                                                    <p className="mb-0 text-white lead">Fill the form to create your course.</p>
                                                </div>
                                                <div>
                                                    <Link to="/instructor/courses/" className="btn" style={{ backgroundColor: "white" }}>
                                                        <i className="fas fa-arrow-left"></i> Back to Course
                                                    </Link>
                                                    <button type="submit" className="btn btn-success ms-2">
                                                        Save <i className="fas fa-check-circle"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
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
                                                type="file"
                                                className="form-control"
                                                name="image"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={loading.image}
                                            />
                                            {loading.image && <p className="text-muted">Uploading image...</p>}
                                            {errors.image && <small className="text-danger">{errors.image}</small>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Intro Video</label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="file"
                                                accept="video/*"
                                                onChange={handleFileUpload}
                                                disabled={loading.file}
                                            />
                                            {loading.file && <p className="text-muted">Uploading video...</p>}
                                            {courseData.file && (
                                                <p>
                                                    <a target="_blank" href={courseData.file} rel="noopener noreferrer">
                                                        Preview Video
                                                    </a>
                                                </p>
                                            )}
                                            {errors.file && <small className="text-danger">{errors.file}</small>}
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
                                            {errors.title && <small className="text-danger">{errors.title}</small>}
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
                                                {categories?.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                            {errors.category && <small className="text-danger">{errors.category}</small>}
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
                                            {errors.level && <small className="text-danger">{errors.level}</small>}
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
                                            {errors.language && <small className="text-danger">{errors.language}</small>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <CKEditor
                                                editor={ClassicEditor}
                                                data={courseData.description}
                                                onChange={(event, editor) => {
                                                    setCourseData({ ...courseData, description: editor.getData() });
                                                    setErrors((prev) => ({ ...prev, description: "" }));
                                                }}
                                                config={{
                                                    toolbar: ["bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "undo", "redo"],
                                                }}
                                            />
                                            <small>Brief course summary.</small>
                                            {errors.description && <small className="text-danger">{errors.description}</small>}
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
                                            {errors.price && <small className="text-danger">{errors.price}</small>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                name="teacher_course_status"
                                                value={courseData.teacher_course_status}
                                                onChange={handleCourseInputChange}
                                            >
                                                <option value="">Select status</option>
                                                <option value="Published">Published</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                            {errors.teacher_course_status && (
                                                <small className="text-danger">{errors.teacher_course_status}</small>
                                            )}
                                        </div>
                                        <div className="mb-3 form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="featured"
                                                name="featured"
                                                checked={courseData.featured}
                                                onChange={handleCourseInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="featured">
                                                Mark as Featured
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="card mb-3">
                                    <div className="card-header border-bottom px-4 py-3">
                                        <h4 className="mb-0">Modules</h4>
                                    </div>
                                    <div className="card-body">
                                        {courseData.variants.map((variant, variantIndex) => (
                                            <div key={variantIndex} className="mb-4 p-3 border rounded">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5>Module {variantIndex + 1}</h5>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeVariant(variantIndex)}
                                                    >
                                                        Delete Module
                                                    </button>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Title</label>
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        value={variant.title}
                                                        onChange={(e) => handleVariantChange(variantIndex, "title", e.target.value)}
                                                    />
                                                    {errors[`variant_${variantIndex}_title`] && (
                                                        <small className="text-danger">{errors[`variant_${variantIndex}_title`]}</small>
                                                    )}
                                                </div>
                                                <h6 className="mt-4">Lessons</h6>
                                                {variant.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="mb-3 p-3 border rounded">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <h6>Lesson {itemIndex + 1}</h6>
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => removeItem(variantIndex, itemIndex)}
                                                            >
                                                                Delete Lesson
                                                            </button>
                                                        </div>
                                                        <div className="mb-2">
                                                            <label className="form-label">Title</label>
                                                            <input
                                                                className="form-control"
                                                                type="text"
                                                                value={item.title}
                                                                onChange={(e) =>
                                                                    handleItemChange(variantIndex, itemIndex, "title", e.target.value)
                                                                }
                                                            />
                                                            {errors[`item_${variantIndex}_${itemIndex}_title`] && (
                                                                <small className="text-danger">
                                                                    {errors[`item_${variantIndex}_${itemIndex}_title`]}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="mb-2">
                                                            <label className="form-label">Description</label>
                                                            <textarea
                                                                className="form-control"
                                                                value={item.description}
                                                                onChange={(e) =>
                                                                    handleItemChange(variantIndex, itemIndex, "description", e.target.value)
                                                                }
                                                            />
                                                        </div>
                                                        <div className="mb-2">
                                                            <label className="form-label">Video</label>
                                                            <input
                                                                className="form-control"
                                                                type="file"
                                                                accept="video/*"
                                                                onChange={(e) => handleFileUpload(e, variantIndex, itemIndex)}
                                                                disabled={loading.file}
                                                            />
                                                            {loading.file && <p className="text-muted">Uploading video...</p>}
                                                            {item.file && (
                                                                <p>
                                                                    <a href={item.file} target="_blank" rel="noopener noreferrer">
                                                                        View video
                                                                    </a>
                                                                </p>
                                                            )}
                                                            {errors[`item_${variantIndex}_${itemIndex}_file`] && (
                                                                <small className="text-danger">
                                                                    {errors[`item_${variantIndex}_${itemIndex}_file`]}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="form-check">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={item.preview}
                                                                onChange={(e) =>
                                                                    handleItemChange(variantIndex, itemIndex, "preview", e.target.checked)
                                                                }
                                                            />
                                                            <label className="form-check-label">Allow Preview</label>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={() => addItem(variantIndex)}
                                                >
                                                    Add Lesson
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-primary" onClick={addVariant}>
                                            Add Module
                                        </button>
                                        {errors.variants && <small className="text-danger">{errors.variants}</small>}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-lg btn-success w-100 mt-2"
                                    type="submit"
                                    disabled={isSubmitting || loading.file || loading.image}
                                >
                                    {isSubmitting ? "Creating..." : "Create Course"} <i className="fas fa-check-circle"></i>
                                </button>
                            </section>
                        </form>
                    </div>
                </div>
            </section>
            <BaseFooter />
        </>
    );
}

export default CourseCreate;