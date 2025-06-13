import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { setUser } from "./utils/auth";
import { useAuthStore } from "./store/auth";
import './locales/i18n';

import { CartContext, ProfileContext } from "./views/plugin/Context";
import apiInstance from "./utils/axios";
import CartId from "./views/plugin/CartId";

import MainWrapper from "./layouts/MainWrapper";
import PrivateRoute from "./layouts/PrivateRoute";
import AboutUs from "./views/auth/AboutUs";
import ContactUs from "./views/auth/ContactUs";

import Register from "../src/views/auth/Register";
import Login from "../src/views/auth/Login";
import ClerkCallback from "../src/views/auth/ClerkCallback";
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreateNewPassword from "./views/auth/CreateNewPassword";

import Index from "./views/base/Index";
import CourseDetail from "./views/base/CourseDetail";
import Cart from "./views/base/Cart";
import Checkout from "./views/base/Checkout";
import Success from "./views/base/Success";
import Search from "./views/base/Search";

import StudentDashboard from "./views/student/Dashboard";
import StudentCourses from "./views/student/Courses";
import StudentCourseDetail from "./views/student/CourseDetail";
import Wishlist from "./views/student/Wishlist";
import StudentProfile from "./views/student/Profile";
import UserData from "./views/plugin/UserData";
import StudentChangePassword from "./views/student/ChangePassword";
import Dashboard from "./views/instructor/Dashboard";
import Courses from "./views/instructor/Courses";
import Review from "./views/instructor/Review";
import Students from "./views/instructor/Students";
import Earning from "./views/instructor/Earning";
import Orders from "./views/instructor/Orders";
import Coupon from "./views/instructor/Coupon";
import TeacherNotification from "./views/instructor/TeacherNotification";
import QA from "./views/instructor/QA";
import ChangePassword from "./views/instructor/ChangePassword";
import Profile from "./views/instructor/Profile";
import CourseCreate from "./views/instructor/CourseCreate";
import CourseEdit from "./views/instructor/CourseEdit";
import StudentQA from "./views/student/QA";
import AITeaching from "./views/student/AITeachingTeam";
import Documentation from "./views/student/Documentation";
import RegisterTeacher from "./views/instructor/RegisterTeacher";

import Chatbot from "./views/chat/Chatbot";

function AppContent() {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const [profile, setProfile] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    
    const { allUserData, loading } = useAuthStore();

    useEffect(() => {
        const init = async () => {
            const success = await setUser();
            setIsReady(true);
            
            if (success && !loading) {
                await loadUserData();
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (isReady && !loading && allUserData && !dataLoaded) {
            loadUserData();
        } else if (!allUserData) {
            setCartCount(0);
            setProfile([]);
            setWishlist([]);
            setDataLoaded(false);
        }
    }, [isReady, loading, allUserData, dataLoaded]);

    const loadUserData = async () => {
        try {
            const userData = UserData();
            if (!userData?.user_id) return;

            const [cartRes, profileRes, wishlistRes] = await Promise.allSettled([
                apiInstance.get(`course/cart-list/${CartId()}/`),
                apiInstance.get(`user/profile/${userData.user_id}/`),
                apiInstance.get(`student/wishlist/${userData.user_id}/`)
            ]);

            if (cartRes.status === 'fulfilled') {
                setCartCount(cartRes.value.data?.length || 0);
            }
            
            if (profileRes.status === 'fulfilled') {
                setProfile(profileRes.value.data);
            }
            
            if (wishlistRes.status === 'fulfilled') {
                setWishlist(wishlistRes.value.data.wishlist || []);
            }
            
            setDataLoaded(true);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    useEffect(() => {
        const handleAuthChanged = (event) => {
            const { type } = event.detail;
            
            switch (type) {
                case 'login':
                    setDataLoaded(false);
                    loadUserData();
                    break;
                    
                case 'logout':
                case 'unauthorized':
                    navigate('/login', { replace: true });
                    break;
                    
                default:
                    break;
            }
        };

        window.addEventListener('auth-changed', handleAuthChanged);
        
        return () => {
            window.removeEventListener('auth-changed', handleAuthChanged);
        };
    }, [navigate]);

    if (!isReady) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <CartContext.Provider value={[cartCount, setCartCount]}>
            <ProfileContext.Provider value={[profile, setProfile]}>
                <MainWrapper>
                    <Routes>
                        <Route path="/register/" element={<Register />} />
                        <Route path="/login/" element={<Login />} />                           
                        <Route path="/clerk-callback" element={<ClerkCallback />} />
                        <Route path="/logout/" element={<Logout />} />
                        <Route path="/forgot-password/" element={<ForgotPassword />} />
                        <Route path="/create-new-password/" element={<CreateNewPassword />} />
                        <Route path="/about-us/" element={<AboutUs />} />
                        <Route path="/contact-us/" element={<ContactUs />} />

                        {/* Base Routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/course-detail/:slug/" element={<CourseDetail />} />
                        <Route path="/cart/" element={<Cart />} />
                        <Route path="/checkout/:order_oid/" element={<Checkout />} />
                        <Route path="/payment-success/:order_oid/" element={<Success />} />
                        <Route path="/search/" element={<Search />} />

                        {/* Student Routes */}
                        <Route
                            path="/student/dashboard/"
                            element={
                                <PrivateRoute>
                                    <StudentDashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/courses/"
                            element={
                                <PrivateRoute>
                                    <StudentCourses />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/courses/:enrollment_id/"
                            element={
                                <PrivateRoute>
                                    <StudentCourseDetail />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/wishlist/"
                            element={
                                <PrivateRoute>
                                    <Wishlist />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/profile/"
                            element={
                                <PrivateRoute>
                                    <StudentProfile />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/change-password/"
                            element={
                                <PrivateRoute>
                                    <StudentChangePassword />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/question-answer/"
                            element={
                                <PrivateRoute>
                                    <StudentQA />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/ai-teaching-agent/"
                            element={
                                <PrivateRoute>
                                    <AITeaching />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/student/ai-document-list/"
                            element={
                                <PrivateRoute>
                                    <Documentation/>
                                </PrivateRoute>
                            }
                        />

                        {/* Teacher Routes */}
                        <Route
                            path="/instructor/register/"
                            element={
                                <PrivateRoute>
                                    <RegisterTeacher />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/dashboard/"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/courses/"
                            element={
                                <PrivateRoute>
                                    <Courses />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/reviews/"
                            element={
                                <PrivateRoute>
                                    <Review />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/students/"
                            element={
                                <PrivateRoute>
                                    <Students />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/earning/"
                            element={
                                <PrivateRoute>
                                    <Earning />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/orders/"
                            element={
                                <PrivateRoute>
                                    <Orders />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/coupon/"
                            element={
                                <PrivateRoute>
                                    <Coupon />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/notifications/"
                            element={
                                <PrivateRoute>
                                    <TeacherNotification />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/question-answer/"
                            element={
                                <PrivateRoute>
                                    <QA />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/change-password/"
                            element={
                                <PrivateRoute>
                                    <ChangePassword />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/profile/"
                            element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/create-course/"
                            element={
                                <PrivateRoute>
                                    <CourseCreate/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/instructor/edit-course/:course_id/"
                            element={
                                <PrivateRoute>
                                    <CourseEdit />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                    <Chatbot/>
                </MainWrapper>
            </ProfileContext.Provider>
        </CartContext.Provider>
    );
}

function App() {
    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </ClerkProvider>
    );
}

export default App;