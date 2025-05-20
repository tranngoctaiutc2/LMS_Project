import { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import BaseHeader from "../partials/BaseHeader";
import BaseFooter from "../partials/BaseFooter";
import { logout } from "../../utils/auth";
import { CartContext } from "../plugin/Context";
import Toast from "../plugin/Toast";

function Logout() {
  const [_, setCartCount] = useContext(CartContext);

  useEffect(() => {
    logout();
    setCartCount(0);
    Toast.success("Logout successful");
  }, [setCartCount]);

  return (
    <>
      <BaseHeader />

      <section className="container d-flex flex-column vh-100 justify-content-center align-items-center">
        <div className="row w-100 justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="card shadow rounded-4 border-0">
              <div className="card-body p-5 text-center">
                <h1 className="fw-bold mb-3">You've been logged out</h1>
                <p className="text-muted mb-4">
                  Thanks for visiting our website. See you again soon!
                </p>
                <div className="d-flex flex-column gap-3">
                  <Link to="/" className="btn btn-outline-secondary w-100">
                    Back to Home <i className="fas fa-home ms-1"></i>
                  </Link>
                  <Link to="/login/" className="btn btn-primary w-100">
                    Login <i className="fas fa-sign-in-alt ms-1"></i>
                  </Link>
                  <Link to="/register/" className="btn btn-outline-primary w-100">
                    Register <i className="fas fa-user-plus ms-1"></i>
                  </Link>
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

export default Logout;
