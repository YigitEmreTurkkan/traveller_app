import React, { useState } from "react";
import { registerUser, loginUser } from "./firebase/auth";
import { saveUserData } from "./firebase/firestore";
import "./Auth.css";

function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");

        try {
            if (isLogin) {
                const user = await loginUser(email, password);
                console.log("Giriş başarılı:", user.email);
            } else {
                if (!firstName || !lastName) {
                    setError("Lütfen tüm alanları doldurun.");
                    return;
                }
                const user = await registerUser(email, password);
                await saveUserData(user.uid, { 
                    email,
                    firstName,
                    lastName,
                    createdAt: new Date().toISOString()
                });
                console.log("Kayıt başarılı:", user.email);
            }
        } catch (error) {
            let errorMessage = "Bir hata oluştu.";
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Bu e-posta adresi zaten kullanımda.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Geçersiz e-posta adresi.";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "Şifre en az 6 karakter olmalıdır.";
            } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                errorMessage = "E-posta veya şifre hatalı.";
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{isLogin ? "Hoş Geldiniz" : "Hesap Oluştur"}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleAuth}>
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Ad"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Soyad"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="E-posta"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="submit-button">
                        {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                    </button>
                </form>
                <div className="auth-switch">
                    <button 
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                            setEmail("");
                            setPassword("");
                            setFirstName("");
                            setLastName("");
                        }} 
                        className="switch-button"
                    >
                        {isLogin ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
                    </button>
                </div>
            </div>
            <div className="footer">
                <span>Yiğit Emre TÜRKKAN</span> tarafından geliştirilmiştir.
            </div>
        </div>
    );
}

export default Auth;
