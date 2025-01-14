import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Kullanıcı kaydı
export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Kayıt hatası:", error.code, error.message);
        throw error;
    }
};

// Kullanıcı girişi
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Giriş hatası:", error.code, error.message);
        throw error;
    }
};

// Kullanıcı çıkışı
export const logoutUser = async () => {
    try {
        await signOut(auth);
        console.log("Çıkış başarılı");
    } catch (error) {
        console.error("Çıkış hatası:", error.code, error.message);
        throw error;
    }
};
