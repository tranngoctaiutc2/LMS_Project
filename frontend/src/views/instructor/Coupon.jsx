import React, { useState, useEffect } from "react";
import moment from "moment";
import { Modal, Button, Badge, Alert } from "react-bootstrap";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";

import apiInstance from "../../utils/axios";
import UserData from "../plugin/UserData";
import Toast from "../plugin/Toast";

function Coupon() {
    const [coupons, setCoupons] = useState([]);
    const [createCoupon, setCreateCoupon] = useState({
        code: "",
        discount: 0,
        valid_from: "",
        valid_to: "",
        max_uses: "",
        active: true,
    });
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchCoupons = async () => {
        try {
        setIsLoading(true);
        const res = await apiInstance.get(
            `teacher/coupon-list/${UserData()?.teacher_id}/`
        );
        setCoupons(res.data);
        } catch (err) {
        setError("Failed to fetch coupons. Please try again later.");
        console.error(err);
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleInputChange = (event) => {
    const { name, value } = event.target;
        setCreateCoupon({
        ...createCoupon,
        [name]: value,
        });
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
    try {
        const formdata = new FormData();
        formdata.append("teacher", UserData()?.teacher_id);
        formdata.append("code", createCoupon.code);
        formdata.append("discount", createCoupon.discount);
        formdata.append("valid_from", createCoupon.valid_from);
        formdata.append("valid_to", createCoupon.valid_to);
        formdata.append("max_uses", createCoupon.max_uses);
        formdata.append("active", createCoupon.active ? "true" : "false");

    await apiInstance.post(
        `teacher/coupon-list/${UserData()?.teacher_id}/`,
        formdata
    );
    fetchCoupons();
    setShowAddModal(false);
    setCreateCoupon({
        code: "",
        discount: 0,
        valid_from: "",
        valid_to: "",
        max_uses: "",
        active: true,
    });
        Toast.success("Coupon created successfully");
    } catch (err) {
        Toast.error("Failed to create coupon");
    }
    };

    const handleDeleteCoupon = async (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
        try {
            await apiInstance.delete(
            `teacher/coupon-detail/${UserData()?.teacher_id}/${couponId}/`
            );
            fetchCoupons();
            Toast.success("Coupon deleted successfully");
        } catch (err) {
            Toast.error("Failed to delete coupon");
            }
        }
    };

    const handleUpdateCoupon = async (e) => {
        e.preventDefault();
    try {
    const formdata = new FormData();
    formdata.append("teacher", UserData()?.teacher_id);
    formdata.append("code", createCoupon.code);
    formdata.append("discount", createCoupon.discount);
    formdata.append("valid_from", createCoupon.valid_from);
    formdata.append("valid_to", createCoupon.valid_to);
    formdata.append("max_uses", createCoupon.max_uses);
    formdata.append("active", createCoupon.active ? "true" : "false");

    await apiInstance.patch(
        `teacher/coupon-detail/${UserData()?.teacher_id}/${selectedCoupon.id}/`,
        formdata
    );
    fetchCoupons();
        setShowModal(false);
        Toast.success("Coupon updated successfully");
    } catch (err) {
        Toast.error("Failed to update coupon");
        }
    };

    return(
        <>

        <BaseHeader />

        <section className="pt-5 pb-5 bg-light">
            <div className="container">
                <Header />
                <div className="row mt-0 mt-md-4">
                    <Sidebar />
                    <div className="col-lg-9 col-md-8 col-12">
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-0 mb-1">
                                        {" "}
                                        <i className="fas fa-tag text-primary"></i> Coupon Manager
                                    </h4>
                                    <p className="mb-0 text-muted">
                                        {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} available
                                    </p>
                                </div>
                                <button 
                                    className="btn btn-primary d-flex align-items-center"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <i className="fas fa-plus me-2"></i> Create Coupon
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="card-body text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <Alert variant="danger" className="m-3">{error}</Alert>
                            ) : coupons.length === 0 ? (
                                <div className="card-body text-center py-5">
                                    <i className="fas fa-tag fs-1 text-muted mb-3"></i>
                                    <h4>No coupons found</h4>
                                    <p className="text-muted">Create your first coupon to get started</p>
                                    <button 
                                        className="btn btn-primary mt-3"
                                        onClick={() => setShowAddModal(true)}
                                    >
                                        Create Coupon
                                    </button>
                                </div>
                            ) : (
                                <div className="card-body">
                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                                                            <i className="fas fa-tag text-primary"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0">Total Coupons</h6>
                                                            <h3 className="mb-0">{coupons.length}</h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                                                            <i className="fas fa-users text-success"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0">Total Usage</h6>
                                                            <h3 className="mb-0">
                                                                {coupons.reduce((sum, coupon) => sum + coupon.used_by, 0)}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Code</th>
                                                    <th>Discount</th>
                                                    <th>Validity</th>
                                                    <th>Usage</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coupons.map((coupon) => (
                                                    <tr key={coupon.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="icon-shape rounded-circle bg-light-primary text-primary me-3">
                                                                    <i className="fas fa-tag"></i>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0">{coupon.code}</h6>
                                                                    <small className="text-muted">
                                                                        Created: {moment(coupon.date).format("MMM D, YYYY")}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="fw-bold text-success">{coupon.discount}%</td>
                                                        <td>
                                                            {coupon.date && coupon.end_date ? (
                                                                <>
                                                                    {moment(coupon.date).format("MMM D")} - {moment(coupon.end_date).format("MMM D, YYYY")}
                                                                </>
                                                            ) : 'N/A'}
                                                        </td>
                                                        <td>
                                                            {coupon.used_by.length} / {coupon.max_uses || '∞'}
                                                        </td>
                                                        <td>
                                                            <Badge bg={coupon.active ? "success" : "secondary"}>
                                                                {coupon.active ? "Active" : "Inactive"}
                                                            </Badge>
                                                            </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => {
                                                                    setSelectedCoupon(coupon);
                                                                    setCreateCoupon({
                                                                        code: coupon.code,
                                                                        discount: coupon.discount,
                                                                        valid_from: coupon.date?.slice(0, 10),
                                                                        valid_to: coupon.end_date?.slice(0, 10),
                                                                        active: coupon.active,
                                                                        max_uses: coupon.max_uses,
                                                                    });
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Edit Coupon Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title>
                    <h4 className="mb-0">
                        Edit Coupon: <span className="text-primary">{selectedCoupon?.code}</span>
                    </h4>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleUpdateCoupon}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Coupon Code</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="code" 
                                value={createCoupon.code}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Discount (%)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                name="discount" 
                                value={createCoupon.discount}
                                onChange={handleInputChange}
                                min="1"
                                max="100"
                                required
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Valid From</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                name="valid_from" 
                                value={createCoupon.valid_from}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Valid To</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                name="valid_to" 
                                value={createCoupon.valid_to}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Maximum Usage</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            name="max_uses" 
                            value={createCoupon.max_uses}
                            onChange={handleInputChange}
                            min="1"
                        />
                    </div>
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            name="active"
                            id="activeCheckbox"
                            checked={createCoupon.active}
                            onChange={(e) =>
                                setCreateCoupon((prev) => ({
                                    ...prev,
                                    active: e.target.checked,
                                }))
                            }
                        />
                        <label className="form-check-label" htmlFor="activeCheckbox">
                            Active
                        </label>
                    </div>
                    <div className="d-flex justify-content-end">
                        <Button variant="light" className="me-2" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Update Coupon
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>

        {/* Add Coupon Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title>
                    <h4 className="mb-0">Create New Coupon</h4>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleCreateCoupon}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Coupon Code</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="code" 
                                value={createCoupon.code}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. SUMMER20"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Discount (%)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                name="discount" 
                                value={createCoupon.discount}
                                onChange={handleInputChange}
                                min="1"
                                max="100"
                                required
                                placeholder="e.g. 20"
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Valid From</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                name="valid_from" 
                                value={createCoupon.valid_from}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Valid To</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                name="valid_to" 
                                value={createCoupon.valid_to}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="form-label">Maximum Usage (Leave empty for unlimited)</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            name="max_uses" 
                            value={createCoupon.max_uses}
                            onChange={handleInputChange}
                            min="1"
                            placeholder="e.g. 100"
                        />
                    </div>
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            name="active"
                            id="activeCheckbox"
                            checked={createCoupon.active}
                            onChange={(e) =>
                                setCreateCoupon((prev) => ({
                                    ...prev,
                                    active: e.target.checked,
                                }))
                            }
                        />
                        <label className="form-check-label" htmlFor="activeCheckbox">
                            Active
                        </label>
                    </div>
                    <div className="d-flex justify-content-end">
                        <Button variant="light" className="me-2" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create Coupon
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>

        <BaseFooter />
    </>
);
} 
export default Coupon;