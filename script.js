const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyBjE86fVS_dOR3eyCW8AMvx99KsCQ4NT0k",
    authDomain: "travellerappdb.firebaseapp.com",
    projectId: "travellerappdb",
    storageBucket: "travellerappdb.firebasestorage.app",
    messagingSenderId: "989342995771",
    appId: "1:989342995771:web:70233d3de976bdfe83131e"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const validCountries = [
    "Andorra", "United Arab Emirates", "Afghanistan", "Antigua and Barbuda", "Anguilla",
    "Albania", "Armenia", "Angola", "Argentina", "American Samoa", "Austria", "Australia",
    "Aruba", "Aland Islands", "Azerbaijan", "Bosnia and Herzegovina", "Barbados",
    "Bangladesh", "Belgium", "Burkina Faso", "Bulgaria", "Bahrain", "Burundi", "Benin",
    "Saint Barthelemy", "Brunei Darussalam", "Bolivia", "Bermuda",
    "Bonaire; St. Eustatius and Saba", "Brazil", "Bahamas", "Bhutan", "Bouvet Island",
    "Botswana", "Belarus", "Belize", "Canada", "Cocos  (Keeling)  Islands", "Congo (Rep.)",
    "Central African Republic", "Republic of Congo", "Switzerland", "Cote d'Ivoire",
    "Cook Islands", "Chile", "Cameroon", "China", "Colombia", "Costa Rica", "Cuba",
    "Cape Verde", "Curacao", "Christmas Island", "Cyprus", "Czech Republic", "Germany",
    "Djibouti", "Denmark", "Dominica", "Dominican Republic", "Algeria", "Ecuador", "Egypt",
    "Estonia", "Western Sahara", "Eritrea", "Spain", "Ethiopia", "Finland", "Fiji",
    "Falkland Islands", "Federated States of Micronesia", "Faroe Islands", "France",
    "Gabon", "United Kingdom", "Georgia", "Grenada", "French Guiana", "Guernsey", "Ghana",
    "Gibraltar", "Greenland", "Gambia", "Guinea", "Glorioso Islands", "Guadeloupe",
    "Equatorial Guinea", "Greece", "South Georgia and South Sandwich Islands", "Guatemala",
    "Guam", "Guinea-Bissau", "Guyana", "Hong Kong", "Heard Island and McDonald Islands",
    "Honduras", "Croatia", "Haiti", "Hungary", "Indonesia", "Ireland", "Israel",
    "Isle of Man", "India", "British Indian Ocean Territory", "Iraq", "Iran", "Iceland",
    "Italy", "Jersey", "Jamaica", "Jordan", "Japan", "Juan De Nova Island", "Kenya",
    "Kyrgyzstan", "Cambodia", "Kiribati", "Comoros", "St. Kitts and Nevis", "North Korea",
    "South Korea", "Kosovo", "Kuwait", "Cayman Islands", "Kazakhstan",
    "Lao People's Democratic Republic", "Lebanon", "St. Lucia", "Liechtenstein",
    "Sri Lanka", "Liberia", "Lesotho", "Lithuania", "Luxembourg", "Latvia", "Libya",
    "Morocco", "Monaco", "Moldova", "Madagascar", "Montenegro", "Saint Martin",
    "Marshall Islands", "Macedonia", "Mali", "Macau", "Myanmar", "Mongolia",
    "Northern Mariana Islands", "Martinique", "Mauritania", "Montserrat", "Malta",
    "Mauritius", "Maldives", "Malawi", "Mexico", "Malaysia", "Mozambique", "Namibia",
    "New Caledonia", "Niger", "Norfolk Island", "Nigeria", "Nicaragua", "Netherlands",
    "Norway", "Nepal", "Nauru", "Niue", "New Zealand", "Oman", "Panama", "Peru",
    "French Polynesia", "Papua New Guinea", "Philippines", "Pakistan", "Poland",
    "Saint Pierre and Miquelon", "Pitcairn Islands", "Puerto Rico", "Palestinian Territory",
    "Portugal", "Palau", "Paraguay", "Qatar", "Reunion", "Romania", "Serbia",
    "Russian Federation", "Rwanda", "Saudi Arabia", "Solomon Islands", "Seychelles",
    "Sudan", "Sweden", "Singapore", "St. Helena", "Slovenia", "Svalbard and Jan Mayen",
    "Slovakia", "Sierra Leone", "San Marino", "Senegal", "Somalia", "Suriname",
    "South Sudan", "Sao Tome and Principe", "El Salvador", "Saint Martin", "Syria",
    "Swaziland", "Turks and Caicos Islands", "Chad",
    "French Southern and Antarctic Lands", "Togo", "Thailand", "Tajikistan", "Tokelau",
    "Timor-Leste", "Turkmenistan", "Tunisia", "Tonga", "Türkiye", "Trinidad and Tobago",
    "Tuvalu", "Taiwan", "Tanzania", "Ukraine", "Uganda", "Jarvis Island", "Baker Island",
    "Howland Island", "Johnston Atoll", "Midway Islands", "Wake Island", "United States",
    "Uruguay", "Uzbekistan", "Vatican City", "St. Vincent and the Grenadines",
    "Venezuela", "British Virgin Islands", "US Virgin Islands", "Vietnam", "Vanuatu",
    "Wallis and Futuna", "Samoa", "Yemen", "Mayotte", "South Africa", "Zambia",
    "Zimbabwe"
];

const cleanFirestoreCountries = async () => {
    try {
        // Tüm ülkeleri getir
        const querySnapshot = await getDocs(collection(db, "countries"));
        const deletedCountries = [];
        let totalDeleted = 0;

        // Her ülkeyi kontrol et
        for (const docSnapshot of querySnapshot.docs) {
            const countryName = docSnapshot.id;
            
            // Eğer ülke geçerli listede yoksa sil
            if (!validCountries.includes(countryName)) {
                await deleteDoc(doc(db, "countries", countryName));
                deletedCountries.push(countryName);
                totalDeleted++;
            }
        }

        console.log("\nSilinen ülkeler:");
        deletedCountries.forEach(country => console.log(`- ${country}`));
        console.log(`\nToplam ${totalDeleted} ülke silindi.`);
        console.log(`Kalan ülke sayısı: ${validCountries.length}`);

    } catch (error) {
        console.error("Hata:", error);
    }
};

cleanFirestoreCountries();
