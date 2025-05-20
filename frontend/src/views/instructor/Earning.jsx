import { useState, useEffect } from "react";
import moment from "moment";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement } from 'chart.js';

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

function Earning() {
    const [stats, setStats] = useState({});
    const [earning, setEarning] = useState([]);
    const [bestSellingCourse, setBestSellingCourse] = useState([]);
    const [timeRange, setTimeRange] = useState('6 Months');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, monthsRes, coursesRes] = await Promise.all([
                    apiInstance.get(`teacher/summary/${UserData()?.teacher_id}/`),
                    apiInstance.get(`teacher/all-months-earning/${UserData()?.teacher_id}/`),
                    apiInstance.get(`teacher/best-course-earning/${UserData()?.teacher_id}/`)
                ]);
                
                setStats(summaryRes.data[0] || {});
                setEarning(monthsRes.data || []);
                setBestSellingCourse(coursesRes.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const calculateGrowthRate = () => {
        if (earning.length < 2) return 0;
        
        const currentMonth = earning[earning.length - 1].total_earning;
        const previousMonth = earning[earning.length - 2].total_earning;
        
        return ((currentMonth - previousMonth) / previousMonth * 100).toFixed(1);
    };

    const filterDataByTimeRange = () => {
        const monthsToShow = timeRange === '30 Days' ? 1 
                          : timeRange === '3 Months' ? 3 
                          : timeRange === '6 Months' ? 6 
                          : 12;
        
        return earning.slice(-monthsToShow);
    };

    const earningChartData = {
        labels: filterDataByTimeRange().map(e => moment().month(e.month - 1).format("MMM")),
        datasets: [
            {
                label: 'Monthly Earnings',
                data: filterDataByTimeRange().map(e => e.total_earning),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.3,
            }
        ]
    };

    const bestCoursesChartData = {
        labels: bestSellingCourse.slice(0, 5).map(b => 
            b.course_title.substring(0, 15) + (b.course_title.length > 15 ? '...' : '')),
        datasets: [
            {
                label: 'Revenue',
                data: bestSellingCourse.slice(0, 5).map(b => b.revenue),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderWidth: 1,
            }
        ]
    };

    const totalRevenueFromTopCourses = bestSellingCourse.reduce((sum, course) => sum + course.revenue, 0);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <BaseHeader />

            <section className="pt-5 pb-5 bg-light">
                <div className="container">
                    <Header />
                    <div className="row mt-0 mt-md-4">
                        <Sidebar />
                        <div className="col-lg-9 col-md-8 col-12">
                            {/* Overview Cards */}
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h4 className="mb-0 mb-1">
                                                {" "}
                                                <i className="fas fa-dollar-sign text-success"></i> Earning Dashboard
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                {stats.monthly_revenue ? 
                                                    `Current month: $${stats.monthly_revenue.toFixed(2)}` : 
                                                    'No earnings data available'}
                                            </p>
                                        </div>
                                        {earning.length > 0 && (
                                            <div className="dropdown">
                                                <button className="btn btn-outline-secondary dropdown-toggle" type="button" 
                                                    data-bs-toggle="dropdown" aria-expanded="false">
                                                    {timeRange}
                                                </button>
                                                <ul className="dropdown-menu">
                                                    <li><button className="dropdown-item" onClick={() => setTimeRange('30 Days')}>30 Days</button></li>
                                                    <li><button className="dropdown-item" onClick={() => setTimeRange('3 Months')}>3 Months</button></li>
                                                    <li><button className="dropdown-item" onClick={() => setTimeRange('6 Months')}>6 Months</button></li>
                                                    <li><button className="dropdown-item" onClick={() => setTimeRange('1 Year')}>1 Year</button></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="row mb-4">
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="text-muted">Total Revenue</span>
                                                    <h2 className="mt-2 mb-0 fw-bold">
                                                        ${stats.total_revenue?.toFixed(2) || '0.00'}
                                                    </h2>
                                                </div>
                                                <div className="bg-primary bg-opacity-10 p-3 rounded">
                                                    <i className="fas fa-wallet fs-3 text-primary"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="text-muted">Monthly Revenue</span>
                                                    <h2 className="mt-2 mb-0 fw-bold">
                                                        ${stats.monthly_revenue?.toFixed(2) || '0.00'}
                                                    </h2>
                                                </div>
                                                <div className="bg-success bg-opacity-10 p-3 rounded">
                                                    <i className="fas fa-chart-line fs-3 text-success"></i>
                                                </div>
                                            </div>
                                            {earning.length >= 2 && (
                                                <div className="mt-3">
                                                    <span className={`badge ${calculateGrowthRate() >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${calculateGrowthRate() >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        <i className={`fas fa-arrow-${calculateGrowthRate() >= 0 ? 'up' : 'down'}`}></i> 
                                                        {Math.abs(calculateGrowthRate())}% from last month
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="text-muted">Top Courses Revenue</span>
                                                    <h2 className="mt-2 mb-0 fw-bold">
                                                        ${totalRevenueFromTopCourses.toFixed(2)}
                                                    </h2>
                                                </div>
                                                <div className="bg-warning bg-opacity-10 p-3 rounded">
                                                    <i className="fas fa-star fs-3 text-warning"></i>
                                                </div>
                                            </div>
                                            {bestSellingCourse.length > 0 && (
                                                <div className="mt-3">
                                                    <span className="badge bg-info bg-opacity-10 text-info">
                                                        {bestSellingCourse.length} top selling courses
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            {earning.length > 0 ? (
                                <div className="card mb-4 border-0 shadow-sm">
                                    <div className="card-header bg-white border-0">
                                        <h4 className="mb-0">Earnings Trend</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="chart-container" style={{height: '300px'}}>
                                            <Line 
                                                data={earningChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function(context) {
                                                                    return `$${context.raw.toFixed(2)}`;
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                callback: function(value) {
                                                                    return `$${value}`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card mb-4 border-0 shadow-sm">
                                    <div className="card-body text-center py-5">
                                        <i className="fas fa-chart-line fs-1 text-muted mb-3"></i>
                                        <h4>No earnings data available</h4>
                                        <p className="text-muted">Your earnings data will appear here once you start selling courses</p>
                                    </div>
                                </div>
                            )}

                            <div className="row">
                                {/* Best Selling Courses */}
                                <div className="col-lg-8 mb-4">
                                    <div className="card border-0 shadow-sm h-100">
                                        <div className="card-header bg-white border-0">
                                            <h4 className="mb-0">Best Selling Courses</h4>
                                        </div>
                                        <div className="card-body">
                                            {bestSellingCourse.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table mb-0 text-nowrap table-hover table-centered">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Course</th>
                                                                <th>Sales</th>
                                                                <th>Revenue</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {bestSellingCourse.map((b, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="position-relative">
                                                                                <img
                                                                                    src={"http://127.0.0.1:8000" + b.course_image}
                                                                                    alt={b.course_title}
                                                                                    className="rounded img-4by3-lg"
                                                                                    style={{
                                                                                        width: "80px",
                                                                                        height: "60px",
                                                                                        objectFit: "cover",
                                                                                    }}
                                                                                />
                                                                                {index < 3 && (
                                                                                    <span className={`position-absolute top-0 start-100 translate-middle badge rounded-pill ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-danger'}`}>
                                                                                        #{index + 1}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="ms-3">
                                                                                <h6 className="mb-0">{b.course_title}</h6>
                                                                                <small className="text-muted">{b.category || 'Uncategorized'}</small>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{b.sales}</td>
                                                                    <td className="fw-bold">${b.revenue?.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i className="fas fa-book-open fs-1 text-muted mb-3"></i>
                                                    <h5>No courses sold yet</h5>
                                                    <p className="text-muted">Your best selling courses will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Distribution */}
                                {bestSellingCourse.length > 0 && (
                                    <div className="col-lg-4 mb-4">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-header bg-white border-0">
                                                <h4 className="mb-0">Revenue Distribution</h4>
                                            </div>
                                            <div className="card-body">
                                                <div className="chart-container" style={{height: '250px'}}>
                                                    <Pie 
                                                        data={bestCoursesChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom',
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: function(context) {
                                                                            const label = context.label || '';
                                                                            const value = context.raw || 0;
                                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                                            const percentage = Math.round((value / total) * 100);
                                                                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Earning History */}
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-white border-0">
                                    <h4 className="mb-0">Earning History</h4>
                                </div>
                                <div className="card-body">
                                    {earning.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Month</th>
                                                        <th>Sales</th>
                                                        <th>Revenue</th>
                                                        <th>Students</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {earning.map((e, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="icon-shape rounded-circle bg-light-primary text-primary me-3">
                                                                        <i className="fe fe-calendar"></i>
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="mb-0">{moment().month(e.month - 1).format("MMMM")}</h6>
                                                                        <small className="text-muted">{moment().month(e.month - 1).format("YYYY")}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{e.total_sales}</td>
                                                            <td className="fw-bold">${e.total_earning?.toFixed(2)}</td>
                                                            <td>{e.total_students}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="fas fa-history fs-1 text-muted mb-3"></i>
                                            <h5>No earning history</h5>
                                            <p className="text-muted">Your monthly earnings will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    );
}

export default Earning;