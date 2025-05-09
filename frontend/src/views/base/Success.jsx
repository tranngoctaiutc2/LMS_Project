import React, { useState, useEffect, useContext} from "react";
import { Link, useParams, useLocation, useNavigate} from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import CartId from "../plugin/CartId";
import { CartContext } from "../plugin/Context";

import apiInstance from "../../utils/axios";

function Success() {
    const [orderMessage, setOrderMessage] = useState("Processing Payment");
    const [isLoading, setIsLoading] = useState(true);
    const [cartCount, setCartCount] = useContext(CartContext);
    const navigate = useNavigate();
    
    const param = useParams();
    const location = useLocation();
    const urlParam = new URLSearchParams(location.search);

    const paypalOrderId = urlParam.get("paypal_order_id");
    const vnpSecureHash = urlParam.get("vnp_SecureHash");
    const vnpResponseCode = urlParam.get("vnp_ResponseCode");
    const vnpTxnRef = urlParam.get("vnp_TxnRef");

    const deleteCartItemsAfterPayment = async () => {
        try {
            const cartId = CartId();
    
            await apiInstance.delete(`course/cart-item-delete/${cartId}/`);
    
            localStorage.removeItem("randomString");
            setCartCount(0);
            console.log("Delete success");
        } catch (error) {
            console.error("Fail to delete", error);
        }
    };
    
    
    useEffect(() => {
        const verifyPayment = async () => {
            if (!param.order_oid && !vnpTxnRef && !paypalOrderId) {
                setOrderMessage("Missing payment information");
                setIsLoading(false);
                return;
            }
            const formdata = new FormData();

            formdata.append("order_oid", param.order_oid || vnpTxnRef);

            if (paypalOrderId) {
                formdata.append("paypal_order_id", paypalOrderId);
            }            

            if (vnpResponseCode && vnpSecureHash) {
                for (const [key, value] of urlParam.entries()) {
                    if (key.startsWith("vnp_")) {
                        formdata.append(key, value);
                    }
                }
            }

            try {
                apiInstance.post(`payment/payment-success/`, formdata).then((res) => {
                    console.log(res.data);
                    setOrderMessage(res.data.message);
                    if (res.data.message === "Payment Successful") {
                        deleteCartItemsAfterPayment();
                    }
                });
            } catch (error) {
                console.error("Payment verification failed full error:", error);
                const errorMessage = vnpResponseCode 
                    ? getVnpayErrorMessage(vnpResponseCode) 
                    : "Payment Failed";
                setOrderMessage(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        verifyPayment();
    }, [param.order_oid, paypalOrderId, vnpResponseCode, vnpSecureHash, vnpTxnRef, location.search, navigate]);

    const getVnpayErrorMessage = (code) => {
        const errorMap = {
            '00': 'Payment Successful',
            '07': 'Transaction suspected of fraud',
            '09': 'Card/Account not registered',
            '10': 'Incorrect authentication',
            '11': 'Payment expired',
            '12': 'Card/Account blocked',
            '13': 'Incorrect transaction amount',
            '24': 'Operation cancelled',
            '51': 'Insufficient balance',
            '65': 'Exceeded transaction limit',
            '75': 'Bank is under maintenance',
            '79': 'Incorrect payment password',
            '99': 'Other error'
        };
        return errorMap[code] || `Payment Failed (Code: ${code})`;
    };

    return (

        <>
            <BaseHeader />

            <section className="pt-0 position-relative overflow-hidden my-auto">
                <div className="container position-relative">
                    <div className="row g-5 align-items-center justify-content-center">
                        {/* Successful Payment */}
                        {(orderMessage === "Payment Successful" || orderMessage === "Already Paid") && (
                            <>
                                <div className="col-lg-5">
                                    <h1 className="text-success">Enrollment Successful!</h1>
                                    <p>Your enrollment was successful, please visit your dashboard to start your course now.</p>
                                    <p>You will be redirected automatically in 5 seconds...</p>
                                    <Link to="/student/dashboard" className="btn btn-success mb-0 rounded-2">
                                        Go to Dashboard <i className="fas fa-arrow-right ms-2"></i>
                                    </Link>
                                </div>
                                <div className="col-lg-7 text-center">
                                    <img src="https://i.pinimg.com/originals/0d/e4/1a/0de41a3c5953fba1755ebd416ec109dd.gif" 
                                         className="h-300px h-sm-400px h-md-500px h-xl-700px" 
                                         alt="Success animation" />
                                </div>
                            </>
                        )}

                        {/* Processing */}
                        {isLoading && (
                            <>
                                <div className="col-lg-5">
                                    <h1 className="text-warning">
                                        Processing Payment <i className="fas fa-spinner fa-spin"></i>
                                    </h1>
                                    <p>Hey there, hold on while we process your payment, please do not leave the page.</p>
                                </div>
                                <div className="col-lg-7 text-center">
                                    <img src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1259.gif" 
                                         className="h-300px h-sm-400px h-md-500px h-xl-700px" 
                                         alt="Loading animation" />
                                </div>
                            </>
                        )}

                        {/* Failed Payment */}
                        {!isLoading && orderMessage && orderMessage !== "Payment Successful" && orderMessage !== "Already Paid" && (
                            <>
                                <div className="col-lg-5">
                                    <h1 className="text-danger">Payment Failed 😔</h1>
                                    <p className="text-muted">{orderMessage}</p>
                                    
                                    <div className="d-flex gap-2">
                                        <button 
                                            onClick={() => window.location.reload()} 
                                            className="btn btn-danger mb-0 rounded-2"
                                        >
                                            Try again <i className="fas fa-repeat ms-2"></i>
                                        </button>
                                        <Link to="/" className="btn btn-outline-secondary mb-0 rounded-2">
                                            Back to Home
                                        </Link>
                                    </div>
                                </div>
                                <div className="col-lg-7 text-center">
                                    <img src="https://media3.giphy.com/media/h4OGa0npayrJX2NRPT/giphy.gif?cid=790b76117pc6298jypyph0liy6xlp3lzb7b2y405ixesujeu&ep=v1_stickers_search&rid=giphy.gif&ct=e" 
                                         className="h-300px h-sm-400px h-md-500px h-xl-700px" 
                                         alt="Error animation" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <BaseFooter />
        </>
    );
}

export default Success;