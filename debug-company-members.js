// Debug script to check companyMembers collection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const { getAuth, onAuthStateChanged } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBvJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "rexa-engage.firebaseapp.com",
  projectId: "rexa-engage",
  storageBucket: "rexa-engage.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('Current user:', user.uid, user.email);
    
    // Check if user exists in companyMembers
    const q = query(
      collection(db, 'companyMembers'),
      where('userId', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ User NOT found in companyMembers collection');
    } else {
      console.log('✅ User found in companyMembers collection');
      querySnapshot.forEach((doc) => {
        console.log('Member data:', doc.data());
      });
    }
  } else {
    console.log('No user logged in');
  }
});