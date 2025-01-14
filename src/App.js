import React, { useState, useEffect } from "react";
import Auth from "./Auth"; // Giriş/Kayıt bileşeni
import "./App.css"; // Stil dosyası
import { onAuthStateChanged } from "firebase/auth"; // Firebase Authentication dinleyicisi
import { auth } from "./firebase/firebase"; // Firebase yapılandırması
import { saveMapData, fetchMapData, fetchCountryDetails, fetchAllCountries, fetchVisaRequirements } from "./firebase/firestore"; // Firestore işlemleri
import svgPanZoom from "svg-pan-zoom"; // SVG Pan & Zoom

function App() {
    const [user, setUser] = useState(null); // Kullanıcı durumu
    const [countries, setCountries] = useState({}); // Harita durumları
    const [countryDetails, setCountryDetails] = useState({}); // Ülke detayları
    const [markedCount, setMarkedCount] = useState(0); // İşaretlenen ülke sayısı
    const [availableCountries, setAvailableCountries] = useState([]);
    const [selectedPassportCountry, setSelectedPassportCountry] = useState("");
    const [visaRequirement, setVisaRequirement] = useState("");
    const totalCountries = 195; // Sabit ülke sayısı
    const [selectedCountry, setSelectedCountry] = useState("");
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini al
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // İlk veri çekme
                const userCountries = await fetchMapData(currentUser.uid);
                setCountries(userCountries || {});
            }
        });

        return () => unsubscribe();
    }, []);

    // Harita verilerini ve renkleri güncelle
    useEffect(() => {
        if (!user) return;

        const fetchAndUpdateData = async () => {
            try {
                // Harita verilerini çek
                const userCountries = await fetchMapData(user.uid);
                if (!userCountries) return;
                
                setCountries(userCountries);

                // SVG haritasını güncelle
                const svgElement = document.getElementById("svgMap");
                if (svgElement && svgElement.contentDocument) {
                    const paths = svgElement.contentDocument.querySelectorAll("path");
                    paths.forEach(path => {
                        const countryName = path.getAttribute("title");
                        if (userCountries[countryName]) {
                            const status = userCountries[countryName];
                            const colors = {
                                visited: "#FF6F61",
                                lived: "#42A5F5",
                                living: "#66BB6A",
                                wantToVisit: "#FFA726",
                                notVisited: "#D3D3D3",
                            };
                            path.style.fill = colors[status];
                        }
                    });
                }
            } catch (error) {
                console.error("Veri güncellenirken hata:", error);
            }
        };

        // İlk yükleme
        fetchAndUpdateData();

        // Her 30 saniyede bir güncelle
        const interval = setInterval(fetchAndUpdateData, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Sadece ilk yüklemede önerileri al
    useEffect(() => {
        if (!user) return;

        const loadInitialRecommendations = async () => {
            try {
                const newRecommendations = await getCountryRecommendations();
                setRecommendations(newRecommendations);
            } catch (error) {
                console.error("İlk öneriler yüklenirken hata:", error);
            }
        };

        loadInitialRecommendations();
    }, [user]);

    // Önerileri güncelle fonksiyonu
    const updateRecommendations = async () => {
        try {
            const newRecommendations = await getCountryRecommendations();
            setRecommendations(newRecommendations);
        } catch (error) {
            console.error("Öneriler güncellenirken hata:", error);
        }
    };

    // İşaretlenen ülke sayısını güncelle
    useEffect(() => {
        const updateMarkedCount = async () => {
            if (!user) return;

            try {
                // Veritabanından güncel verileri al
                const userCountries = await fetchMapData(user.uid);
                if (!userCountries) return;

                // Ziyaret edilen ülkeleri say
                const marked = Object.values(userCountries).filter((status) =>
                    ["visited", "lived", "living"].includes(status)
                ).length;

                setMarkedCount(marked);
            } catch (error) {
                console.error("Ziyaret edilen ülke sayısı güncellenirken hata:", error);
            }
        };

        updateMarkedCount();
    }, [user, countries]);

    useEffect(() => {
        const marked = Object.values(countries).filter((status) =>
            ["visited", "lived", "living"].includes(status)
        ).length;
        setMarkedCount(marked);
    }, [countries]);

    // Ülke durumu değiştiğinde
    const handleCountryStatusChange = async (country, status) => {
        try {
            // Ülke rengini güncelle
            updateCountryColor(country, status);

            // Veritabanını güncelle
            const updatedCountries = { ...countries, [country.getAttribute("title")]: status };
            await saveMapData(user.uid, updatedCountries);
            setCountries(updatedCountries);

            // Ziyaret edilen ülke sayısını güncelle
            const marked = Object.values(updatedCountries).filter((s) =>
                ["visited", "lived", "living"].includes(s)
            ).length;
            setMarkedCount(marked);
        } catch (error) {
            console.error("Ülke durumu güncellenirken hata:", error);
        }
    };

    useEffect(() => {
        if (!user) return; // Kullanıcı yoksa işlem yapma

        const svgMapElement = document.getElementById("svgMap");

        const handleMapLoad = () => {
            const svgDoc = svgMapElement.contentDocument;
            if (!svgDoc) {
                console.error("SVG içeriği yüklenemedi.");
                return;
            }

            svgPanZoom(svgDoc.querySelector("svg"), {
                zoomEnabled: true,
                controlIconsEnabled: true,
                fit: true,
                center: true,
            });

            const countriesElements = svgDoc.querySelectorAll("path");

            countriesElements.forEach((country) => {
                const countryName = country.getAttribute("title");

                if (countries[countryName]) {
                    updateCountryColor(country, countries[countryName]);
                }

                country.addEventListener("mouseenter", () => {
                    const displayElement = document.getElementById("countryNameDisplay");
                    displayElement.textContent = countryName || "Bilinmiyor";
                });

                country.addEventListener("mouseleave", () => {
                    const displayElement = document.getElementById("countryNameDisplay");
                    displayElement.textContent = "";
                });

                country.addEventListener("click", async () => {
                    const infoBox = document.getElementById("infoBox");
                    const countryTitle = document.getElementById("countryTitle");

                    // Önceki seçili ülkenin efektini kaldır
                    const previousSelected = svgDoc.querySelector(".selected-country");
                    if (previousSelected) {
                        previousSelected.classList.remove("selected-country");
                        previousSelected.style.stroke = null;
                        previousSelected.style.strokeWidth = null;
                        previousSelected.style.filter = null;
                    }

                    // Yeni seçilen ülkeye efekt ekle
                    country.classList.add("selected-country");
                    country.style.stroke = "#808080";
                    country.style.strokeWidth = "1.5";
                    country.style.filter = "drop-shadow(0 0 2px rgba(128, 128, 128, 0.5))";

                    setSelectedCountry(countryName);
                    countryTitle.textContent = countryName || "Bir ülke seçiniz";
                    infoBox.classList.remove("hidden");

                    const countryData = await fetchCountryDetails(countryName);
                    setCountryDetails(countryData || {});

                    await updateVisaRequirement(selectedPassportCountry, countryName);

                    // Status butonlarını tek tıklamada güncelle
                    document.querySelectorAll(".status-button").forEach((button) => {
                        // Önceki event listener'ları temizle
                        const oldButton = button.cloneNode(true);
                        button.parentNode.replaceChild(oldButton, button);
                        
                        // Yeni event listener ekle
                        oldButton.addEventListener("click", async () => {
                            const status = oldButton.getAttribute("data-status");
                            await handleCountryStatusChange(country, status);
                        }, { once: true }); // Her tıklamada sadece bir kez çalışsın
                    });
                });
            });
        };

        svgMapElement.addEventListener("load", handleMapLoad);

        return () => {
            svgMapElement.removeEventListener("load", handleMapLoad);
        };
    }, [user, countries, selectedPassportCountry]);

    const updateCountryColor = (country, status) => {
        const colors = {
            visited: "#FF6F61",
            lived: "#42A5F5",
            living: "#66BB6A",
            wantToVisit: "#FFA726",
            notVisited: "#D3D3D3",
        };
        country.style.fill = colors[status];
    };

    const handleLogout = async () => {
        await auth.signOut();
        localStorage.removeItem('user');
        setUser(null);
        setCountries({});
    };

    // Fetch available countries on component mount
    useEffect(() => {
        const getCountries = async () => {
            const countries = await fetchAllCountries();
            setAvailableCountries(countries);
        };
        getCountries();
    }, []);

    // Pasaport ülkesi değiştiğinde vize bilgisini güncelle
    useEffect(() => {
        updateVisaRequirement(selectedPassportCountry, selectedCountry);
    }, [selectedPassportCountry, selectedCountry]);

    // Vize bilgisini güncelleyen fonksiyon
    const updateVisaRequirement = async (fromCountry, toCountry) => {
        if (fromCountry && toCountry) {
            try {
                const requirement = await fetchVisaRequirements(fromCountry, toCountry);
                console.log("Vize gereksinimleri güncellendi:", { from: fromCountry, to: toCountry, requirement });
                setVisaRequirement(requirement);
            } catch (error) {
                console.error("Vize bilgisi alınırken hata:", error);
                setVisaRequirement("Vize bilgisi alınamadı");
            }
        } else {
            setVisaRequirement("");
        }
    };

    // Basitleştirilmiş öneri sistemi
    const getCountryRecommendations = async () => {
        if (!user) return [];
        
        try {
            const allCountries = await fetchAllCountries();
            if (!allCountries?.length) return [];

            // Ziyaret edilmemiş ülkeleri filtrele
            const unvisitedCountries = allCountries.filter(country => 
                !countries[country] || !["visited", "lived", "living"].includes(countries[country])
            );

            if (unvisitedCountries.length < 3) return [];

            const recommendations = [];
            const shuffledCountries = unvisitedCountries
                .sort(() => Math.random() - 0.5)
                .slice(0, 15); // Daha fazla ülke kontrol et
            
            for (const country of shuffledCountries) {
                const details = await fetchCountryDetails(country);
                
                if (details) {
                    // Eksik veya geçersiz verisi olan ülkeleri ele
                    if (!details.crime_rate || 
                        !details.happiness_rank || 
                        !details.internet_pct ||
                        details.crime_rate === "Not Available" ||
                        details.happiness_rank === "Not Ranked" ||
                        details.internet_pct === "Not Available") {
                        continue;
                    }

                    // Sayısal değerlere dönüştür
                    const crimeRate = parseFloat(details.crime_rate);
                    const happinessRank = parseInt(details.happiness_rank);
                    const internetScore = parseFloat(details.internet_pct);

                    // Geçersiz sayısal değerleri olan ülkeleri ele
                    if (isNaN(crimeRate) || isNaN(happinessRank) || isNaN(internetScore)) {
                        continue;
                    }

                    // Suç oranı kontrolü (10'dan düşük olmalı - çok güvenli ülkeler)
                    if (crimeRate > 15) continue; // Suç oranı yüksek ülkeleri ele

                    // Mutluluk sıralaması kontrolü (ilk 50'de olmalı)
                    if (happinessRank > 50) continue; // Mutluluk sıralaması düşük ülkeleri ele

                    // İnternet kalitesi kontrolü
                    if (internetScore < 6) continue; // İnternet kalitesi düşük ülkeleri ele
                    
                    // Puanlama sistemi
                    const crimeScore = Math.max(0, 100 - (crimeRate * 10)); // Suç oranına daha fazla ağırlık ver
                    const happinessScore = Math.max(0, 100 - ((happinessRank - 1) * 2)); // Mutluluk sıralamasına daha fazla ağırlık ver
                    const internetScoreWeighted = internetScore * 10;

                    // Toplam puan (suç ve mutluluk daha önemli)
                    const totalScore = (crimeScore * 0.4) + (happinessScore * 0.4) + (internetScoreWeighted * 0.2);

                    recommendations.push({
                        country,
                        score: Math.round(totalScore),
                        details: {
                            happiness_rank: happinessRank,
                            internet_pct: internetScore,
                            crime_rate: crimeRate
                        }
                    });
                }
            }

            // En iyi 3 ülkeyi döndür
            return recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

        } catch (error) {
            console.error("Öneriler alınırken hata:", error);
            return [];
        }
    };

    // Önerilen ülkeye tıklama işleyicisi
    const handleRecommendationClick = async (countryName) => {
        const svgDoc = document.getElementById("svgMap").contentDocument;
        const infoBox = document.getElementById("infoBox");
        const countryTitle = document.getElementById("countryTitle");

        // Önceki seçili ülkenin efektini kaldır
        const previousSelected = svgDoc.querySelector(".selected-country");
        if (previousSelected) {
            previousSelected.classList.remove("selected-country");
            previousSelected.style.stroke = null;
            previousSelected.style.strokeWidth = null;
            previousSelected.style.filter = null;
        }

        // Yeni seçilen ülkeyi bul ve efekt ekle
        const selectedCountry = svgDoc.querySelector(`path[title="${countryName}"]`);
        if (selectedCountry) {
            selectedCountry.classList.add("selected-country");
            selectedCountry.style.stroke = "#808080";
            selectedCountry.style.strokeWidth = "1.5";
            selectedCountry.style.filter = "drop-shadow(0 0 2px rgba(128, 128, 128, 0.5))";
        }

        // InfoBox'ı güncelle
        setSelectedCountry(countryName);
        countryTitle.textContent = countryName;
        infoBox.classList.remove("hidden");

        // Ülke detaylarını getir
        const countryData = await fetchCountryDetails(countryName);
        setCountryDetails(countryData || {});

        // Vize gereksinimlerini güncelle
        await updateVisaRequirement(selectedPassportCountry, countryName);
    };

    if (!user) {
        return <Auth />;
    }

    return (
        <div className="App">
            <div className="logo-container">
                <img src="/travellers_guide.png" alt="Traveller's Guide" className="logo" />
            </div>
            <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">🔓</span> Çıkış Yap
            </button>
            <h1 className="page-title">Your Travel Map</h1>
            <div id="mapContainer">
                <div id="mapBox">
                    <object
                        id="svgMap"
                        data="/world.svg"
                        type="image/svg+xml"
                        aria-label="World map displaying countries"
                    ></object>
                </div>
            </div>
            <div id="countryNameDisplay" style={{ textAlign: "center", marginTop: "20px", fontSize: "18px" }}></div>
            <div id="infoBox" className="info-box hidden">
                <button className="close-button" onClick={() => {
                    document.getElementById("infoBox").classList.add("hidden");
                    // Seçili ülke efektini kaldır
                    const svgDoc = document.getElementById("svgMap").contentDocument;
                    if (svgDoc) {
                        const selectedCountry = svgDoc.querySelector(".selected-country");
                        if (selectedCountry) {
                            selectedCountry.classList.remove("selected-country");
                            selectedCountry.style.stroke = null;
                            selectedCountry.style.strokeWidth = null;
                            selectedCountry.style.filter = null;
                        }
                    }
                    setSelectedCountry("");
                }}>✖</button>
                <h2 id="countryTitle">Bir Ülke Seçiniz</h2>
                <ul>
                    {countryDetails.capital_city && <li data-label="Başkent">{countryDetails.capital_city}</li>}
                    {countryDetails.currency && <li data-label="Para Birimi">{countryDetails.currency}</li>}
                    {countryDetails.happiness_rank && <li data-label="Mutluluk Sıralaması">{countryDetails.happiness_rank}</li>}
                    {countryDetails.internet_pct && <li data-label="İnternet Kalitesi (%)">{countryDetails.internet_pct || "Bilgi Yok"}</li>}
                    {countryDetails.life_expectancy && <li data-label="Yaşam Süresi">{countryDetails.life_expectancy} yıl</li>}
                    {countryDetails.political_leader && <li data-label="Siyasi Lider">{countryDetails.political_leader}</li>}
                    {countryDetails.region && <li data-label="Bölge">{countryDetails.region}</li>}
                    {countryDetails.crime_rate && <li data-label="Suç Oranı (%)">{countryDetails.crime_rate}</li>}
                    <li data-label="Vize Durumu" className={`${visaRequirement && visaRequirement.toLowerCase().includes('required') ? 'visa-required' : visaRequirement && visaRequirement.toLowerCase().includes('free') ? 'visa-not-required' : ''}`}>
                        {selectedPassportCountry ? 
                            visaRequirement.toLowerCase().includes('required') ? 'Vize Gerekli' :
                            visaRequirement.toLowerCase().includes('free') ? 'Vizesiz' :
                            visaRequirement : "Lütfen Pasaport Ülkesi Seçin"}
                    </li>
                </ul>
                <div id="options" className="button-container">
                    <button className="status-button" data-status="visited">✈️ Gittim</button>
                    <button className="status-button" data-status="living">📍 Yaşıyorum</button>
                    <button className="status-button" data-status="lived">🏠 Yaşadım</button>
                    <button className="status-button" data-status="wantToVisit">💭 Gitmek İstiyorum</button>
                    <button className="status-button" data-status="notVisited">❌ Gitmedim</button>
                </div>
            </div>
            <div className="passport-selector">
                <h3>Pasaport Ülkesi</h3>
                <select 
                    value={selectedPassportCountry} 
                    onChange={(e) => setSelectedPassportCountry(e.target.value)}
                >
                    <option value="">Pasaport Ülkesi Seçin</option>
                    {availableCountries.map((country, index) => (
                        <option key={index} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </div>
            <div id="scoreboard" className="scoreboard">
                <h3>Dünya Haritam</h3>
                <p>Keşfedilen Ülkeler: {markedCount} / {totalCountries}</p>
                <div className="progress-container">
                    <div 
                        className="progress-bar" 
                        style={{ width: `${(markedCount / totalCountries) * 100}%` }}
                    ></div>
                </div>
                <div className="percentage">
                    {((markedCount / totalCountries) * 100).toFixed(1)}%
                </div>
            </div>
            <div className="recommendations">
                <div className="recommendations-header">
                    <h3>Önerilen Ülkeler</h3>
                    <button 
                        className="refresh-button"
                        onClick={updateRecommendations}
                    >
                        🔄 Yenile
                    </button>
                </div>
                <div className="recommendations-container">
                    {recommendations && recommendations.length > 0 ? (
                        recommendations.map((rec, index) => (
                            <div 
                                key={index} 
                                className="recommendation-card"
                                onClick={() => handleRecommendationClick(rec.country)}
                            >
                                <h4>🎯 {rec.country}</h4>
                                <div className="recommendation-stats">
                                    <span title="Mutluluk Sıralaması">😊 {rec.details.happiness_rank}</span>
                                    <span title="İnternet Kalitesi">🌐 {rec.details.internet_pct}</span>
                                    <span title="Suç Oranı">🚨 {rec.details.crime_rate}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="recommendation-card">
                            <p>Önerileri görmek için yenile butonuna basın</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;

