import { doc, setDoc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase.js"; // Firebase yapılandırması

// Kullanıcı bilgilerini Firestore'a kaydet
export const saveUserData = async (userId, userData) => {
    try {
        await setDoc(doc(db, "users", userId), userData); // "users" koleksiyonuna yaz
        console.log("Kullanıcı bilgileri başarıyla kaydedildi.");
    } catch (error) {
        console.error("Kullanıcı bilgileri kaydedilirken hata oluştu:", error.message);
    }
};

// Kullanıcı bilgilerini Firestore'dan getir
export const fetchUserData = async (userId) => {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.log("Kullanıcı bilgileri bulunamadı.");
            return null;
        }
    } catch (error) {
        console.error("Kullanıcı bilgileri alınırken hata oluştu:", error.message);
    }
};

// Kullanıcının harita durumlarını Firestore'a kaydet
export const saveMapData = async (userId, countries) => {
    try {
        const docRef = doc(db, "maps", userId);
        const existingDoc = await getDoc(docRef);

        if (existingDoc.exists()) {
            const existingData = existingDoc.data().countries || {};
            const updatedData = { ...existingData, ...countries }; // Mevcut verilerle birleştir
            await updateDoc(docRef, { countries: updatedData });
        } else {
            await setDoc(docRef, { countries });
        }

        console.log("Harita verisi başarıyla kaydedildi.");
    } catch (error) {
        console.error("Harita verisi kaydedilirken hata oluştu:", error.message);
    }
};

// Kullanıcının harita durumlarını Firestore'dan getir
export const fetchMapData = async (userId) => {
    try {
        const docRef = doc(db, "maps", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().countries;
        } else {
            console.log("Harita verisi bulunamadı.");
            return {};
        }
    } catch (error) {
        console.error("Harita verisi alınırken hata oluştu:", error.message);
    }
};

// Yeni Fonksiyon: Ülke açıklamasını Firestore'dan getir
export const fetchCountryDescription = async (countryName) => {
    try {
        const docRef = doc(db, "countries", countryName); // Belge kimliği ülke adı
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().description || "Açıklama mevcut değil."; // description alanını döner
        } else {
            console.log(`Belirtilen ülke için veri bulunamadı: ${countryName}`);
            return "Bu ülke için açıklama mevcut değil.";
        }
    } catch (error) {
        console.error("Ülke açıklaması alınırken hata oluştu:", error.message);
        return "Veri alınırken hata oluştu.";
    }
};

// Yeni Fonksiyon: Ülke açıklamasını güncelle
export const updateCountryDescription = async (countryName, newDescription) => {
    try {
        const docRef = doc(db, "countries", countryName);
        await updateDoc(docRef, { description: newDescription });
        console.log(`Açıklama başarıyla güncellendi: ${countryName}`);
    } catch (error) {
        console.error("Açıklama güncellenirken hata oluştu:", error.message);
    }
};

// Yeni Fonksiyon: Ülke detaylarını Firestore'dan getir
export const fetchCountryDetails = async (countryName) => {
    try {
        const docRef = doc(db, "countries", countryName); // Belge kimliği ülke adı
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data(); // Ülke detaylarını döndür
        } else {
            console.log(`Belirtilen ülke için veri bulunamadı: ${countryName}`);
            return {};
        }
    } catch (error) {
        console.error("Ülke detayları alınırken hata oluştu:", error.message);
        return {};
    }
};

// Tüm ülkeleri getir
export const fetchAllCountries = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "countries"));
        const countries = [];
        querySnapshot.forEach((doc) => {
            countries.push(doc.id);
        });
        return countries.sort();
    } catch (error) {
        console.error("Ülkeler alınırken hata oluştu:", error.message);
        return [];
    }
};

// Vize gereksinimlerini getir
export const fetchVisaRequirements = async (fromCountry, toCountry) => {
    try {
        console.log("Vize bilgisi isteniyor:", { fromCountry, toCountry });
        
        // Doğru yolu kullanarak vize gereksinimini al
        const requirementRef = doc(db, "countries", fromCountry, "requirements", toCountry);
        const requirementSnap = await getDoc(requirementRef);
        
        if (requirementSnap.exists()) {
            const data = requirementSnap.data();
            return data.requirement || "Vize bilgisi bulunamadı";
        }

        return "Vize bilgisi bulunamadı";
    } catch (error) {
        console.error("Vize gereksinimleri alınırken hata:", error);
        return "Vize bilgisi alınırken hata oluştu";
    }
};
