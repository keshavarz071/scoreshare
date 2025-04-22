// Full Scoreshare Web App with Upload, Dashboard, Avatar, Chat, Rating, and Bookmarks
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  arrayUnion
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, User } from "lucide-react";

// Firebase config placeholder
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function ScoreshareWebApp() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [scores, setScores] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatText, setChatText] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUserAvatar(userDoc.data().avatar);
          setBookmarks(userDoc.data().bookmarks || []);
        }
      } else {
        setUserAvatar(null);
        setBookmarks([]);
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        query(collection(db, "scores"), orderBy("createdAt", "desc")),
        (snapshot) => {
          setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      );
      const chatUnsub = onSnapshot(
        query(collection(db, "chats"), orderBy("createdAt")),
        (snapshot) => {
          setChats(snapshot.docs.map(doc => doc.data()));
          chatRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      );
      return () => {
        unsubscribe();
        chatUnsub();
      };
    }
  }, [user]);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          avatar: "",
          bookmarks: []
        });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleUpload = async () => {
    if (!uploadFile) return;
    const storageRef = ref(storage, `scores/${uploadFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, uploadFile);
    uploadTask.on("state_changed", null, null, async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db, "scores"), {
        url: downloadURL,
        name: uploadFile.name,
        user: user.email,
        createdAt: serverTimestamp(),
        rating: 0
      });
      setUploadFile(null);
    });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const storageRef = ref(storage, `avatars/${user.uid}`);
    await uploadBytesResumable(storageRef, avatarFile);
    const avatarURL = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", user.uid), { avatar: avatarURL });
    setUserAvatar(avatarURL);
  };

  const sendChat = async () => {
    if (chatText.trim()) {
      await addDoc(collection(db, "chats"), {
        text: chatText,
        user: user.email,
        createdAt: serverTimestamp()
      });
      setChatText("");
    }
  };

  const toggleBookmark = async (scoreId) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const current = userDoc.data().bookmarks || [];
    const updated = current.includes(scoreId) ? current.filter(id => id !== scoreId) : [...current, scoreId];
    await updateDoc(userRef, { bookmarks: updated });
    setBookmarks(updated);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      {/* UI layout omitted for brevity */}
    </div>
  );
}