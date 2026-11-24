import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import style from "./Login.module.css";
import { BoxArrowInRight, ShieldLock } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import sirsImage from "../Images/sirsImage4.jpeg";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { simpanCSRFToken, CSRFToken } = useCSRFTokenContext();

  // Jika sesi masih aktif, langsung ke beranda
  useEffect(() => {
    const cekSesi = async () => {
      try {
        await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
        navigate("/beranda", { replace: true });
      } catch (error) {
        // belum login, tetap di halaman login
      }
    };
    cekSesi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Auth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const results = await axios.post(
        "/apisirs6v2/login",
        { userName: email, password: password },
        { headers: { "Content-Type": "application/json" } },
      );
      simpanCSRFToken(results.data.data.csrfToken);
      navigate("/beranda", { replace: true });
    } catch (error) {
      toast(
        error.response?.data?.message || "Login gagal, silakan coba lagi",
        { position: toast.POSITION.TOP_RIGHT },
      );
    } finally {
      setLoading(false);
    }
  };

  const loginSSO = () => {
    window.location.replace(
      process.env.REACT_APP_BASE_SSO +
        "?continued=" +
        process.env.REACT_APP_BASE_APP,
    );
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="row">
        <div className="col-md-12">
          <div className={`row ${style.content}`}>
            <div className="col-md-6">
              <img src={sirsImage} className="img-fluid" alt="SIRS" />
            </div>
            <div className="col-md-6">
              <div
                className="row align-items-center"
                style={{ minHeight: "65vh" }}
              >
                <div className="col-md-12">
                  <h3 className="h3 mb-3">Login</h3>
                  <form onSubmit={Auth}>
                    <div className="form-floating mb-3">
                      <input
                        type="email"
                        className="form-control"
                        id="floatingInput"
                        placeholder="Email"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <label htmlFor="floatingInput">Email</label>
                    </div>
                    <div className="form-floating">
                      <input
                        type="password"
                        className="form-control"
                        id="floatingPassword"
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <label htmlFor="floatingPassword">Password</label>
                    </div>
                    <div className="d-grid gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={loading}
                      >
                        <BoxArrowInRight /> {loading ? "Memproses..." : "Masuk"}
                      </button>
                    </div>
                  </form>

                  <div className={style.divider}>
                    <span>atau</span>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={loginSSO}
                      disabled={loading}
                    >
                      <ShieldLock /> Masuk dengan SSO Kemenkes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
