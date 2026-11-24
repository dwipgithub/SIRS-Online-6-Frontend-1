// Kerangka RL32: tab SIRS (Manual/) & tab SATUSEHAT (SATUSEHAT/).
// Struktur sama dengan RL34/RL51. Selama SATUSEHAT belum ada, halaman Manual
// ditampilkan langsung (tanpa tombol tab).
//
// Cara mengaktifkan SATUSEHAT:
//   1. Buat SATUSEHAT/TabSatuSehatRL32.js (+ .module.css), contoh: RL34/SATUSEHAT
//   2. Ganti baris "const TabSatuSehat = null;" di bawah dengan:
//        import TabSatuSehat from "./SATUSEHAT/TabSatuSehatRL32";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useCSRFTokenContext } from "../Context/CSRFTokenContext";
import { getStatusSatset } from "../../api/status_satset.js";
import drape from "../Shared/PageDrape.module.css";
import RL32Manual from "./Manual/RL32Manual";

const TabSatuSehat = null;

const JUDUL = "RL 3.2 Rawat Inap";

// Tab SIRS | SATUSEHAT. Tab SATUSEHAT hanya muncul untuk user rumah sakit
// (jenisUserId 4) yang status SATUSEHAT-nya aktif.
const TabMenu = () => {
  const [activeTab, setActiveTab] = useState("tab1");
  const { CSRFToken } = useCSRFTokenContext();
  const [user, setUser] = useState({});
  const [statusSatset, setStatusSatset] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const muat = async () => {
      try {
        const response = await axios.get("/apisirs6v2/token", {
          headers: { "XSRF-TOKEN": CSRFToken },
        });
        const token = response.data.accessToken;
        setUser(jwt_decode(token));
        setStatusSatset(await getStatusSatset(token));
      } catch (error) {
        if (error.response) navigate("/");
      }
    };
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`container ${drape.drape}`}
      style={{ marginTop: "70px", marginBottom: "70px" }}
    >
      <div className="row">
        <div className="col-md-12">
          <h4>
            <span style={{ color: "gray" }}>{JUDUL}</span>
          </h4>
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "tab1" ? "active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                SIRS
              </button>
            </li>
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

      <div className="tab-content mt-3">
        <div className={`tab-pane fade ${activeTab === "tab1" ? "show active" : ""}`}>
          <RL32Manual />
        </div>
        <div className={`tab-pane fade ${activeTab === "tab2" ? "show active" : ""}`}>
          {activeTab === "tab2" && <TabSatuSehat />}
        </div>
      </div>
    </div>
  );
};

const RL32 = () => (TabSatuSehat ? <TabMenu /> : <RL32Manual />);

export default RL32;
