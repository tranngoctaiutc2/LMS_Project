import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import Toast from "../plugin/Toast";
import CartId from "../plugin/CartId";
import { CartContext } from "../plugin/Context";
import { userId } from "../../utils/constants";

function Cart() {
  const [cart, setCart] = useState([]);
  const [cartStats, setCartStats] = useState({});
  const [cartCount, setCartCount] = useContext(CartContext);
  const [bioData, setBioData] = useState({
    full_name: "",
    email: "",
    country: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItem();
  }, []);

  const fetchCartItem = async () => {
    try {
      const [cartRes, statsRes] = await Promise.all([
        apiInstance.get(`course/cart-list/${CartId()}/`),
        apiInstance.get(`cart/stats/${CartId()}/`),
      ]);
      setCart(cartRes.data);
      setCartStats(statsRes.data);
      setCartCount(cartRes.data?.length || 0);
    } catch (error) {
      Toast.error("Failed to fetch cart");
    }
  };

  const cartItemDelete = async (itemId) => {
    try {
      await apiInstance.delete(`course/cart-item-delete/${CartId()}/${itemId}/`);
      Toast.success("Cart item deleted");
      fetchCartItem();
    } catch (error) {
      Toast.error("Failed to delete cart item");
    }
  };

  const deleteAllCartItems = async () => {
    try {
      await apiInstance.delete(`course/cart-item-delete/${CartId()}/`);
      Toast.success("Deleted all cart items");
      fetchCartItem();
    } catch (error) {
      Toast.error("Failed to delete all items");
    }
  };

  const handleBioDataChange = (event) => {
    setBioData({
      ...bioData,
      [event.target.name]: event.target.value,
    });
  };

  const createOrder = async (e) => {
    e.preventDefault();

    const { full_name, email, country } = bioData;

    if (!full_name.trim() || !email.trim() || !country.trim()) {
      Toast.warning("Please provide your full name, email, and country.");
      return;
    }

    const formData = new FormData();
    formData.append("full_name", full_name.trim());
    formData.append("email", email.trim());
    formData.append("country", country.trim());
    formData.append("cart_id", CartId());
    formData.append("user_id", userId());

    try {
      const res = await apiInstance.post(`order/create-order/`, formData);
      Toast.success("Order created successfully!");
      navigate(`/checkout/${res.data.order_oid}/`);
    } catch (error) {
      Toast.error(error?.response?.data?.detail || "Failed to create order");
    }
  };

  return (
    <>
      <BaseHeader />

      <section className="py-0">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bg-light p-4 text-center rounded-3">
                <h1 className="m-0">My cart</h1>
                <div className="d-flex justify-content-center">
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb breadcrumb-dots mb-0">
                      <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none text-dark">Home</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <Link to="/courses" className="text-decoration-none text-dark">Courses</Link>
                      </li>
                      <li className="breadcrumb-item active" aria-current="page">Cart</li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-5">
        <div className="container">
          <form onSubmit={createOrder}>
            <div className="row g-4 g-sm-5">
              <div className="col-lg-8 mb-4 mb-sm-0">
                <div className="p-4 shadow rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Cart Items ({cart?.length})</h5>
                    <button
                      onClick={deleteAllCartItems}
                      disabled={cart.length === 0}
                      className="btn btn-sm btn-danger"
                      type="button"
                    >
                      Delete All
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-center text-muted">Your cart is empty.</p>
                  ) : (
                    <div className="table-responsive border-0 rounded-3">
                      <table className="table align-middle p-4 mb-0">
                        <tbody>
                          {cart.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="d-lg-flex align-items-center">
                                  <div className="me-3">
                                    <img
                                      src={c.course.image}
                                      className="rounded"
                                      style={{ width: "100px", height: "70px", objectFit: "cover" }}
                                      alt={c.course.title}
                                    />
                                  </div>
                                  <h6 className="mb-0">
                                    <Link to={`/course/${c.course.slug}`} className="text-decoration-none text-dark">
                                      {c.course.title}
                                    </Link>
                                  </h6>
                                </div>
                              </td>
                              <td className="text-center">
                                <h5 className="text-success mb-0">${c.price}</h5>
                              </td>
                              <td className="text-end">
                                <button
                                  onClick={() => cartItemDelete(c.id)}
                                  className="btn btn-sm btn-danger"
                                  type="button"
                                >
                                  <i className="fas fa-times" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="shadow p-4 rounded-3 mt-5">
                  <h5 className="mb-3">Personal Details</h5>
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label htmlFor="yourName" className="form-label">Your name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="yourName"
                        name="full_name"
                        placeholder="John Doe"
                        value={bioData.full_name}
                        onChange={handleBioDataChange}
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="emailInput" className="form-label">Email address *</label>
                      <input
                        type="email"
                        className="form-control"
                        id="emailInput"
                        name="email"
                        placeholder="you@example.com"
                        value={bioData.email}
                        onChange={handleBioDataChange}
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="countryInput" className="form-label">Country *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="countryInput"
                        name="country"
                        placeholder="Your country"
                        value={bioData.country}
                        onChange={handleBioDataChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="p-4 shadow rounded-3">
                  <h4 className="mb-3">Cart Total</h4>
                  <ul className="list-group mb-3">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Sub Total <span>${cartStats.price?.toFixed(2) || "0.00"}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Tax <span>${cartStats.tax?.toFixed(2) || "0.00"}</span>
                    </li>
                    <li className="list-group-item fw-bold d-flex justify-content-between align-items-center">
                      Total <span className="fw-bold">${cartStats.total?.toFixed(2) || "0.00"}</span>
                    </li>
                  </ul>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-success btn-lg" disabled={cart.length === 0}>
                      Proceed to Checkout
                    </button>
                  </div>
                  <p className="small mt-2 text-center">
                    By proceeding, you agree to the{" "}
                    <Link to="/terms"><strong>Terms of Service</strong></Link>.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default Cart;
