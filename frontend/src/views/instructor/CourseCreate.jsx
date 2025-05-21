import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { Link, useNavigate } from "react-router-dom";
import apiInstance from "../../utils/axios";
import { teacherId } from "../../utils/constants";
import Toast from "../plugin/Toast";

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
        apiInstance
        .get("course/category/")
        .then((res) => setCategories(res.data))
        .catch(() => Toast.error("Failed to load categories!"));
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setCourseData((prev) => ({ ...prev, image: file }));
        setErrors((prev) => ({ ...prev, image: "" }));
    };

    const handleFileUpload = async (e, variantIndex = null, itemIndex = null) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("video/")) {
        const key = variantIndex !== null ? `item_${variantIndex}_${itemIndex}_file` : "file";
        setErrors((prev) => ({ ...prev, [key]: "Invalid video format." }));
        return;
        }

        setLoading((prev) => ({ ...prev, file: true }));
        try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiInstance.post("/file-upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const url = response?.data?.url;
        if (url) {
            setCourseData((prev) => {
            const updated = { ...prev };
            if (variantIndex !== null && itemIndex !== null) {
                updated.variants[variantIndex].items[itemIndex].file = url;
            } else {
                updated.file = url;
            }
            return updated;
            });
            setErrors((prev) => ({ ...prev, file: "" }));
        }
        } catch {
        setErrors((prev) => ({ ...prev, file: "File upload failed." }));
        }
        setLoading((prev) => ({ ...prev, file: false }));
    };

    const handleCourseInputChange = ({ target }) => {
        const { name, value, type, checked } = target;
        setCourseData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleVariantChange = (i, field, val) => {
        const variants = [...courseData.variants];
        variants[i][field] = val;
        setCourseData((prev) => ({ ...prev, variants }));
        setErrors((prev) => ({ ...prev, [`variant_${i}_${field}`]: "" }));
    };

    const handleItemChange = (vi, ii, field, val) => {
        const variants = [...courseData.variants];
        variants[vi].items[ii][field] = val;
        setCourseData((prev) => ({ ...prev, variants }));
        setErrors((prev) => ({ ...prev, [`item_${vi}_${ii}_${field}`]: "" }));
    };

    const addVariant = () => {
        setCourseData((prev) => ({ ...prev, variants: [...prev.variants, { title: "", items: [] }] }));
    };

    const addItem = (vi) => {
        const variants = [...courseData.variants];
        variants[vi].items.push({ title: "", description: "", file: "", preview: false });
        setCourseData((prev) => ({ ...prev, variants }));
    };

    const removeVariant = (i) => {
        setCourseData((prev) => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
    };

    const removeItem = (vi, ii) => {
        const variants = [...courseData.variants];
        variants[vi].items.splice(ii, 1);
        setCourseData((prev) => ({ ...prev, variants }));
    };

    const validateForm = () => {
        const e = {};
        if (!courseData.title) e.title = "Title required.";
        if (!courseData.category) e.category = "Select category.";
        if (!courseData.level) e.level = "Select level.";
        if (!courseData.language) e.language = "Select language.";
        if (!courseData.price || isNaN(courseData.price)) e.price = "Enter valid price.";
        if (!courseData.description) e.description = "Description required.";
        if (!courseData.teacher_course_status) e.teacher_course_status = "Select status.";
        if (courseData.variants.length === 0) e.variants = "At least 1 module.";
        courseData.variants.forEach((v, i) => {
        if (!v.title) e[`variant_${i}_title`] = "Module title required.";
        v.items.forEach((it, j) => {
            if (!it.title) e[`item_${i}_${j}_title`] = "Lesson title required.";
        });
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const getCookie = (name) => {
        const cookie = document.cookie.split(";").find((c) => c.trim().startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
        Toast.error("Please fill required fields.");
        return;
        }

        setIsSubmitting(true);
        try {
        const formData = new FormData();
        Object.entries({
            ...courseData,
            teacher: teacherId,
            platform_status: "Published",
        }).forEach(([key, val]) => {
            if (key === "image" && val instanceof File) formData.append(key, val);
            else if (key === "variants") formData.append(key, JSON.stringify(val));
            else formData.append(key, val);
        });

        await apiInstance.post("/teacher/course-create/", formData, {
            headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": getCookie("csrftoken"),
            },
        });

        Toast.success("Course Created");
        navigate("/instructor/courses/");
        } catch (error) {
        Toast.error(error.response?.data?.message || "Please try again.");
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