import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import apiInstance from "../../utils/axios";
import Toast from "../plugin/Toast";
import { PAYPAL_CLIENT_ID } from "../../utils/constants";

function Checkout() {
  const [order, setOrder] = useState({});
  const [coupon, setCoupon] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const { order_oid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await apiInstance.get(`order/checkout/${order_oid}/`);
      setOrder(res.data);
    } catch (error) {
      Toast.error("Failed to fetch order");
    }
  };

  const applyCoupon = async () => {
    const formdata = new FormData();
    formdata.append("order_oid", order?.oid);
    formdata.append("coupon_code", coupon);

    try {
      const res = await apiInstance.post(`order/coupon/`, formdata);
      fetchOrder();
      Toast[res.data.icon === "success" ? "success" : "error"](res.data.message);
    } catch (error) {
      const message = error?.response?.data?.detail;
      if (typeof message === "string" && message.includes("Coupon matching query")) {
        Toast.error("Coupon does not exist");
      } else {
        Toast.error("Coupon is not suitable");
      }
    }
  };

  const payWithVNPAY = async (event) => {
    event.preventDefault();
    setPaymentLoading(true);
    try {
      const res = await apiInstance.post(`/payment/vnpay-checkout/${order.oid}/`);
      const paymentUrl = res.data.payment_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        Toast.error("Không nhận được URL thanh toán từ VNPAY.");
      }
    } catch (error) {
      Toast.error("Lỗi khi gửi yêu cầu thanh toán VNPAY.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const initialOptions = {
    clientId: PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  return (
    <>
      <BaseHeader />

      <section className="py-0">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bg-light p-4 text-center rounded-3">
                <h1 className="m-0">Checkout</h1>
                <div className="d-flex justify-content-center">
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb breadcrumb-dots mb-0">
                      <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none text-dark">Home</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <Link to="/courses" className="text-decoration-none text-dark">Courses</Link>
                      </li>
                      <li className="breadcrumb-item">
                        <Link to="/cart" className="text-decoration-none text-dark">Cart</Link>
                      </li>
                      <li className="breadcrumb-item active" aria-current="page">Checkout</li>
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
          <div className="row g-4 g-sm-5">
            <div className="col-xl-8 mb-4 mb-sm-0">
              <div className="p-4 shadow rounded-3 mt-4">
                <h5 className="mb-3">Courses</h5>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <tbody>
                      {order?.order_items?.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={o.course.image}
                                alt={o.course.title}
                                className="rounded"
                                style={{ width: "100px", height: "70px", objectFit: "cover" }}
                              />
                              <h6 className="ms-3 mb-0">{o.course.title}</h6>
                            </div>
                          </td>
                          <td className="text-end text-success fw-bold">
                            ${o.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link to="/cart" className="btn btn-outline-secondary mt-3">
                  Edit Cart <i className="fas fa-edit"></i>
                </Link>
              </div>

              <div className="shadow p-4 rounded-3 mt-5">
                <h5 className="mb-3">Personal Details</h5>
                <form className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-control bg-light" value={order.full_name} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-control bg-light" value={order.email} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Country *</label>
                    <input type="text" className="form-control bg-light" value={order.country} readOnly />
                  </div>
                </form>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="shadow p-4 rounded-3">
                <h4 className="mb-4">Order Summary</h4>

                <div className="input-group mb-3">
                  <input
                    className="form-control"
                    placeholder="COUPON CODE"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <button onClick={applyCoupon} type="button" className="btn btn-primary">
                    Apply
                  </button>
                </div>

                <ul className="list-group mb-3">
                  <li className="list-group-item d-flex justify-content-between">
                    Sub Total <span>${order.sub_total}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    Discount <span>${order.saved}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    Tax <span>${order.tax_fee}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between fw-bold">
                    Total <span>${order.total}</span>
                  </li>
                </ul>

                <div className="d-grid gap-3">
                  {paymentLoading ? (
                    <button className="btn btn-success" disabled>
                      Processing... <i className="fas fa-spinner fa-spin ms-2" />
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={payWithVNPAY}>
                      Pay With VNPAY
                    </button>
                  )}

                  <PayPalScriptProvider options={initialOptions}>
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "USD",
                                value: order.total?.toString(),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          const status = details.status;
                          const paypal_order_id = data.orderID;

                          if (status === "COMPLETED") {
                            navigate(`/payment-success/${order.oid}/?paypal_order_id=${paypal_order_id}`);
                          } else {
                            Toast.error("PayPal payment not completed.");
                          }
                        });
                      }}
                      className="mt-3"
                    />
                  </PayPalScriptProvider>
                </div>

                <p className="small text-center mt-3">
                  By proceeding to payment, you agree to the{" "}
                  <Link to="/terms"><strong>Terms of Service</strong></Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BaseFooter />
    </>
  );
}

export default Checkout;
