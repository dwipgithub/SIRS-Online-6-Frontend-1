// Kerangka tab RL51: tab SIRS (Manual/) & tab SATUSEHAT (SATUSEHAT/).
import React, { useState, useEffect } from "react";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import { getStatusSatset } from "../../api/status_satset.js";
import drape from "../Shared/PageDrape.module.css";
import RL51Manual from "./Manual/RL51Manual";
import TabSatuSehatRL51 from "./SATUSEHAT/TabSatuSehatRL51";

export default function TabMenu() {
  const [activeTab, setActiveTab] = useState("tab1");
  const { CSRFToken } = useCSRFTokenContext();
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [statusSatset, setStatusSatset] = useState(0);

  useEffect(() => {
    refreshToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // kalau token berhasil di-set, baru load status satset
  useEffect(() => {
    if (token) {
      loadStatusSatset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshToken = async () => {
    try {
      const customConfig = {
        headers: {
          "XSRF-TOKEN": CSRFToken,
        },
      };
      const response = await axios.get("/apisirs6v2/token", customConfig);
      setToken(response.data.accessToken);
      const decoded = jwt_decode(response.data.accessToken);
      //   showRumahSakit(decoded.satKerId);
      setExpire(decoded.exp);
      setUser(decoded);
    } catch (error) {
      if (error.response) {
        navigate("/");
      }
    }
  };

  // LOAD STATUS SATSET
  const loadStatusSatset = async () => {
    const status = await getStatusSatset(token);
    setStatusSatset(status);
  };

  const axiosJWT = axios.create();
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        const customConfig = {
          headers: {
            "XSRF-TOKEN": CSRFToken,
          },
        };
        const response = await axios.get("/apisirs6v2/token", customConfig);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwt_decode(response.data.accessToken);
        setExpire(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  return (
    <div
      className={`container ${drape.drape}`}
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <div className="row">
        <div className="col-md-12">
          <h4>
            <span style={{ color: "gray" }}>
              RL 5.1 Morbiditas Pasien Rawat Jalan
            </span>
          </h4>

          {/* TAB HEADER */}
          <ul className="nav nav-tabs">
            {/* TAB SIRS */}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                SIRS
              </button>
            </li>

            {/* TAB SATUSEHAT */}
            {user.jenisUserId === 4 && statusSatset === 1 && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "tab2" ? "active" : ""}`}
                  onClick={() => setActiveTab("tab2")}
                >
                  SATUSEHAT
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* TAB CONTENT SECTION */}
      <div className="tab-content mt-3">
        {/* TAB SIRS */}
        <div
          className={`tab-pane fade ${
            activeTab === "tab1" ? "show active" : ""
          }`}
        >
          <RL51Manual />
        </div>

        {/* TAB SATUSEHAT */}
        <div
          className={`tab-pane fade ${
            activeTab === "tab2" ? "show active" : ""
          }`}
        >
          <TabSatuSehatRL51 />
        </div>
      </div>
    </div>
  );
}
