import React from "react";
import logo from "./assets/travellers_guide.png"; // Logonun yolu
import "./styles.css"; // CSS dosyasını bağla

const HomePage = ({ handleLogout }) => {
    return (
        <div>
            {/* Sol Üst Köşe Logo */}
            <div className="logo-container">
                <img src={logo} alt="Traveller's Guide" className="logo" />
            </div>

            {/* Başlık ve Harita */}
            <h1 className="page-title">Gezgin Uygulaması</h1>
            <div className="map-container">
                {/* Harita buraya eklenebilir */}
            </div>

            {/* Çıkış Yap Butonu */}
            <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">🔓</span> Çıkış Yap
            </button>
        </div>
    );
};

export default HomePage;
