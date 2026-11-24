import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { CSRFTokenProvider } from "./components/Context/CSRFTokenContext.js";

import SsoLogin from "./components/Login/Sso_Login";
import SsoVerif from "./components/Login/SSO_Verif";
import NavigationBar from "./components/NavigationBar/NavigationBar";
import Footer from "./components/Footer/Footer";
import Beranda from "./components/Beranda/beranda";
import { GlassTheme } from "./components/Glass/useGlassTheme";
import ScrollToTop from "./components/ScrollToTop";
import ToastTheme from "./components/Glass/ToastTheme";

// User
import FormUbahPassword from "./components/User/FormUbahPassword";
import FormTambahUser from "./components/User/FormTambahUser";

// RL 3.2
import RL31 from "./components/RL31/RL31";

// RL 3.2
import RL32 from "./components/RL32/RL32";
import FormTambahRL32 from "./components/RL32/Manual/FormTambahRL32";
import FormUbahRL32 from "./components/RL32/Manual/FormUbahRL32";

// RL 3.3
import RL33 from "./components/RL33/RL33";
import FormTambahRL33 from "./components/RL33/Manual/FormTambahRL33";
import FormUbahRL33 from "./components/RL33/Manual/FormUbahRL33";

// RL 3.4
import SatuSehatRL34 from "./components/RL34/SATUSEHAT/SatuSehatRL34.js";
import FormTambahRL34 from "./components/RL34/Manual/FormTambahRL34";
import FormUbahRL34 from "./components/RL34/Manual/FormUbahRL34";
import TabMenu34 from "./components/RL34/RL34.js";

// RL 3.5
import RL35 from "./components/RL35/RL35";
import FormTambahRL35 from "./components/RL35/Manual/FormTambahRL35";
import FormUbahRL35 from "./components/RL35/Manual/FormUbahRL35";

// RL 3.6
import RL36 from "./components/RL36/RL36";
import FormTambahRL36 from "./components/RL36/Manual/FormTambahRL36";
import FormUbahRL36 from "./components/RL36/Manual/FormUbahRL36";

// RL 3.7
import RL37 from "./components/RL37/RL37";
import FormTambahRL37 from "./components/RL37/Manual/FormTambahRL37";
import FormUbahRL37 from "./components/RL37/Manual/FormUbahRL37";

// RL 3.8
import RL38 from "./components/RL38/RL38";
import FormTambahRL38 from "./components/RL38/Manual/FormTambahRL38";
import { FormEditRL38 } from "./components/RL38/Manual/FormUbahRL38";

// RL 3.9
import RL39 from "./components/RL39/RL39";
import FormTambahRL39 from "./components/RL39/Manual/FormTambahRL39.js";
import FormUbahRL39 from "./components/RL39/Manual/FormUbahRL39.js";

// RL 3.10
import RL310 from "./components/RL310/RL310";
import FormEditRL310 from "./components/RL310/Manual/FormEditRL310";
import FormTambahRL310 from "./components/RL310/Manual/FormTambahRL310";

// RL 3.11
import RL311 from "./components/RL311/RL311";
import FormTambahRL311 from "./components/RL311/Manual/FormTambahRL311";
import FormEditRL311 from "./components/RL311/Manual/FormUbahRL311";

// RL 3.12
import RL312 from "./components/RL312/RL312";
import FormTambahRL312 from "./components/RL312/Manual/FormTambahRL312";
import FormEditRL312 from "./components/RL312/Manual/FormUbahRL312";

// RL 3.13
import RL313 from "./components/RL313/RL313";
import FormTambahRL313 from "./components/RL313/Manual/FormTambahRL313";
import FormEditRL313 from "./components/RL313/Manual/FormUbahRL313";

// RL 3.14
import RL314 from "./components/RL314/RL314";
import FormTambahRL314 from "./components/RL314/Manual/FormTambahRL314";
import FormUbahRL314 from "./components/RL314/Manual/FormUbahRL314";

// RL 3.15
import RL315 from "./components/RL315/RL315";
import FormTambahRL315 from "./components/RL315/Manual/FormTambahRL315";
import FormUbahRL315 from "./components/RL315/Manual/FormUbahRL315";

// RL 3.16
import RL316 from "./components/RL316/RL316";
import FormTambahRL316 from "./components/RL316/Manual/FormTambahRL316";
import FormUbahRL316 from "./components/RL316/Manual/FormUbahRL316";

// RL 3.17
import RL317 from "./components/RL317/RL317";
import FormTambahRL317 from "./components/RL317/Manual/FormTambahRL317";
import FormUbahRL317 from "./components/RL317/Manual/FormUbahRL317";

// RL 3.18
import RL318 from "./components/RL318/RL318";
import FormTambahRL318 from "./components/RL318/Manual/FormTambahRL318";
import FormUbahRL318 from "./components/RL318/Manual/FormUbahRL318";

// RL 3.19
import RL319 from "./components/RL319/RL319";
import FormTambahRL319 from "./components/RL319/Manual/FormTambahRL319";
import FormUbahRL319 from "./components/RL319/Manual/FormUbahRL319";

// RL 4.1
import RL41 from "./components/RL41/RL41";
import FormTambahRL41 from "./components/RL41/Manual/FormTambahRL41";
import { FormUbahRL41 } from "./components/RL41/Manual/FormUbahRL41";

// RL 4.2
import RL42 from "./components/RL42/RL42";

// RL 4.3
import RL43 from "./components/RL43/RL43";

// RL 5.1
import FormTambahRL51 from "./components/RL51/Manual/FormTambahRL51";
import FormEditRL51 from "./components/RL51/Manual/FormUbahRL51";
import RL51 from "./components/RL51/RL51.js";

// RL 5.2
import RL52 from "./components/RL52/RL52";

// RL 5.3
import RL53 from "./components/RL53/RL53";

// Absensi
import Absensi from "./components/Absensi/absensi.js";

// MAINTENANCE

function App() {
  return (
    <CSRFTokenProvider>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <ScrollToTop />
        <ToastTheme />
        <Routes>
          <Route path="/" element={<SsoLogin />} />
          <Route path="/verif" element={<SsoVerif />} />
          {/* Form login lokal dihapus; /login (dipakai Logout) diarahkan ke cek akses SSO */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/beranda"
            element={
              <>
                <NavigationBar />
                <Beranda />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/user/tambahuser"
            element={
              <>
                <NavigationBar />
                <FormTambahUser />
                <Footer />
              </>
            }
          />
          <Route
            path="/user/ubahpassword"
            element={
              <>
                <NavigationBar />
                <FormUbahPassword />
                <Footer />
              </>
            }
          />

          <Route
            path="/rl31"
            element={
              <>
                <NavigationBar />
                <RL31 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl32"
            element={
              <>
                <NavigationBar />
                <RL32 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl32/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL32 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl32/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL32 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl33"
            element={
              <>
                <NavigationBar />
                {/* <MaintenancePage /> */}
                <RL33 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl33/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL33 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl33/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL33 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL34"
            element={
              <>
                <NavigationBar />
                <TabMenu34 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/satusehatrl34"
            element={
              <>
                <NavigationBar />
                <SatuSehatRL34 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl34/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL34 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl34/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL34 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl35"
            element={
              <>
                <NavigationBar />
                <RL35 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl35/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL35 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl35/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL35 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl36"
            element={
              <>
                <NavigationBar />
                <RL36 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl36/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL36 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl36/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL36 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl37"
            element={
              <>
                <NavigationBar />
                <RL37 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl37/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL37 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl37/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL37 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl38"
            element={
              <>
                <NavigationBar />
                <RL38 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl38/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL38 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl38/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL38 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl39"
            element={
              <>
                <NavigationBar />
                <RL39 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl39/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL39 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl39/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL39 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl310"
            element={
              <>
                <NavigationBar />
                {/* <MaintenancePage /> */}
                <RL310 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl310/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL310 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl310/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL310 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL311"
            element={
              <>
                <NavigationBar />
                <RL311 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl311/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL311 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl311/edit/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL311 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL312"
            element={
              <>
                <NavigationBar />
                <RL312 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl312/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL312 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl312/edit/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL312 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL313"
            element={
              <>
                <NavigationBar />
                <RL313 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl313/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL313 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl313/edit/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL313 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL314"
            element={
              <>
                <NavigationBar />
                <RL314 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl314/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL314 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl314/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL314 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl315"
            element={
              <>
                <NavigationBar />
                <RL315 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl315/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL315 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl315/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL315 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/RL316"
            element={
              <>
                <NavigationBar />
                <RL316 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl316/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL316 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl316/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL316 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl317"
            element={
              <>
                <NavigationBar />
                <RL317 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl317/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL317 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl317/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL317 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl318"
            element={
              <>
                <NavigationBar />
                <RL318 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl318/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL318 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl318/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL318 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl319"
            element={
              <>
                <NavigationBar />
                <RL319 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl319/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL319 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl319/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL319 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl41"
            element={
              <>
                <NavigationBar />
                <RL41 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl41/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL41 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl41/ubah/:id"
            element={
              <>
                <NavigationBar />
                <FormUbahRL41 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl42"
            element={
              <>
                <NavigationBar />
                <RL42 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl43"
            element={
              <>
                <NavigationBar />
                <RL43 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl51"
            element={
              <>
                <NavigationBar />
                <RL51 />
                <GlassTheme />
              </>
            }
          />

          <Route
            path="/rl51/tambah"
            element={
              <>
                <NavigationBar />
                <FormTambahRL51 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl51/edit/:id"
            element={
              <>
                <NavigationBar />
                <FormEditRL51 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl52"
            element={
              <>
                <NavigationBar />
                <RL52 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/rl53"
            element={
              <>
                <NavigationBar />
                <RL53 />
                <GlassTheme />
              </>
            }
          />
          <Route
            path="/absensi"
            element={
              <>
                <NavigationBar />
                <Absensi />
                <GlassTheme />
              </>
            }
          />
          <Route path="*" element={<PageNotFound />} status={404} />
        </Routes>
      </BrowserRouter>
    </CSRFTokenProvider>
  );
}

function PageNotFound() {
  return (
    <div className="container mt-3">
      <h3>404 page not found</h3>
      <p>We are sorry but the page you are looking for does not exist.</p>
    </div>
  );
}

export default App;
