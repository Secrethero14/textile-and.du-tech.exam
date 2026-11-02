// FIREBASE CONFIG
const firebaseConfig = { apiKey: "AIzaSyBK1T5Nr1CjoPVWPsKnytrgjj05nU8fDs0", authDomain: "hstu---cou--exam-2026.firebaseapp.com", projectId: "hstu---cou--exam-2026", storageBucket: "hstu---cou--exam-2026.firebasestorage.app", messagingSenderId: "1058124789396", appId: "1:1058124789396:web:fc772af33deb7c18c9e681" };

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserEmail = null;

// Global helper for dates (সব ফাইলে নিরাপদে ব্যবহারের জন্য)
function parseDate(data) {
    if (!data) return null;
    const raw = data.timestamp || data.date || data.time || data.created_at || data;
    if (!raw) return null;
    if (typeof raw.toDate === 'function') return raw.toDate(); 
    if (raw.seconds) return new Date(raw.seconds * 1000); 
    const date = new Date(raw);
    return isNaN(date.getTime()) ? null : date;
}

auth.onAuthStateChanged(user => {
    if (user) {
        currentUserEmail = user.email;
        document.getElementById('userName').innerText = user.displayName || "প্রিয় ছাত্র";
        document.getElementById('userEmail').innerHTML = `<i class="fas fa-envelope"></i> ${user.email}`;
        if(user.photoURL) document.getElementById('userPic').src = user.photoURL;
        
        loadUserProfile(user.email);
        fetchStudentData(user.email); 
    } else {
        window.location.href = "index.html";
    }
});
