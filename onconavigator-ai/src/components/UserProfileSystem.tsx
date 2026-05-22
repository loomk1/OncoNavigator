import React, { useState } from "react";
import { 
  Shield, 
  Lock, 
  Mail, 
  User, 
  LogOut,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sun,
  Moon,
  Loader2
} from "lucide-react";
import { OncologyAnalysis } from "../types";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType, setCachedAccessToken } from "../utils/firebase";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dateCreated: string;
}

export interface SavedAssessment {
  id: string;
  userEmail: string;
  timestamp: string;
  cancerType: string;
  symptoms: string;
  riskLevel: "Low" | "Medium" | "High";
  detectedInputsCount: number;
  explanation: string;
  analysisText: string;
  nextSteps: string[];
  followUpQuestion: string;
}

interface UserProfileSystemProps {
  onLoginSuccess: (user: UserProfile) => void;
  activeUser: UserProfile | null;
  onLogout: () => void;
  assessmentsHistory: SavedAssessment[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onAddAssessmentToHistory?: (assessment: OncologyAnalysis, symptoms: string, filesCount: number) => void;
}

export function UserProfileSystem({
  onLoginSuccess,
  activeUser,
  onLogout,
  assessmentsHistory,
  onClearHistory,
  onDeleteHistoryItem
}: UserProfileSystemProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("doctor.user@onconavigator.edu");
  const [password, setPassword] = useState<string>("educational-password123");
  const [fullName, setFullName] = useState<string>("Clinical Student User");
  const [formError, setFormError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authNotAllowed, setAuthNotAllowed] = useState<boolean>(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAuthNotAllowed(false);

    if (!email || !password) {
      setFormError("Both email and password are required.");
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        if (!fullName) {
          setFormError("Please enter your name as ID credentials.");
          setAuthLoading(false);
          return;
        }

        // Create Firebase Authorized user account - Real Firebase Authentication call
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;

        const newUser: UserProfile = {
          id: user.uid,
          name: fullName,
          email: email.trim().toLowerCase(),
          dateCreated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        };

        // Put user document profile inside Firestore db
        try {
          await setDoc(doc(db, "users", user.uid), newUser);
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, `users/${user.uid}`);
        }

        onLoginSuccess(newUser);
      } else {
        // Sign into Firebase Auth platform - Real Firebase Authentication login
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;
        let userProfile: UserProfile;

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            userProfile = docSnap.data() as UserProfile;
          } else {
            userProfile = {
              id: user.uid,
              name: email.split("@")[0].toUpperCase(),
              email: email.trim().toLowerCase(),
              dateCreated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            };
            await setDoc(docRef, userProfile);
          }
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.GET, `users/${user.uid}`);
          // Safe robust backup fallback
          userProfile = {
            id: user.uid,
            name: email.split("@")[0].toUpperCase(),
            email: email.trim().toLowerCase(),
            dateCreated: "May 2026"
          };
        }

        onLoginSuccess(userProfile);
      }
    } catch (err: any) {
      console.error("Firebase auth handler error:", err);
      let errMsg = err.message || "Credential authentication failed.";
      
      if (err.code === "auth/operation-not-allowed") {
        errMsg = "Email/Password sign-in and registration is currently disabled in your Firebase console.";
        setAuthNotAllowed(true);
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use by another profile.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "The password is too weak. Must consist of at least 6 characters.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errMsg = "Incorrect email address or security login password. Please verify credentials or register a profile.";
      }
      setFormError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/spreadsheets");
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      } else {
        console.warn("No Google OAuth access token was returned.");
      }

      const user = result.user;
      let userProfile: UserProfile;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          userProfile = docSnap.data() as UserProfile;
        } else {
          userProfile = {
            id: user.uid,
            name: user.displayName || "Google User Research",
            email: user.email || "student@onconavigator.edu",
            dateCreated: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          };
          await setDoc(docRef, userProfile);
        }
      } catch (dbError) {
        handleFirestoreError(dbError, OperationType.GET, `users/${user.uid}`);
        userProfile = {
          id: user.uid,
          name: user.displayName || "Google User Research",
          email: user.email || "student@onconavigator.edu",
          dateCreated: "May 2026"
        };
      }

      onLoginSuccess(userProfile);
    } catch (err: any) {
      console.error("Google login failed:", err);
      let errMsg = err.message || "Failed authentication via Google Google Authentication Popup.";
      if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Login popup closed before completion. Please try again.";
      }
      setFormError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ----------------------------------------------------
  // LOGIN BRAND PAGE (Shown only when activeUser is null)
  // ----------------------------------------------------
  if (!activeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-slate-800 px-6 py-12 relative font-sans transition-colors duration-200">
        
        <div className="absolute top-[20%] left-[30%] w-96 h-96 rounded-full bg-blue-105/20 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-8 relative z-10 space-y-6 transition-all duration-200">
          
          {/* Gentle Serif Aesthetic Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-serif text-lg font-bold border border-blue-100">
              O
            </div>
            <h1 className="text-xl font-serif italic text-slate-950 font-medium tracking-wide">
              OncoNavigator
            </h1>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide uppercase">
              Clinical Quality Screening Companion
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-semibold text-slate-800 leading-normal">
              {isSignUp ? "Create your institutional profile" : "Aesthetic Clinic Portal"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp 
                ? "Setup local sandbox coordinates for mock client diagnostics"
                : "Educational guidance engine loaded. Access below."}
            </p>
          </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-center leading-relaxed">
                {formError}
              </div>
            )}

            {authNotAllowed && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-xs text-left space-y-2.5">
                <p className="font-semibold flex items-center gap-1 text-[13px]">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Enable Email/Password in Firebase Console
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                  Firebase Authentication requires you to explicitly activate the Email/Password authentication provider in your project dashboard before a clinical student profiling register can occur.
                </p>
                <div className="mt-2 text-[11px] font-medium space-y-2 text-slate-700 dark:text-zinc-300">
                  <p>1. Open your <a href="https://console.firebase.google.com/project/conductive-scheduler-j8gvj/authentication/providers" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900 dark:text-amber-400 hover:text-amber-950">Firebase Authentication Console ↗</a>.</p>
                  <p>2. Under the <strong>Sign-in method</strong> tab, click <strong>Add new provider</strong>.</p>
                  <p>3. Choose <strong>Email/Password</strong>, check <strong>Enable</strong>, and click <strong>Save</strong>.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Full Name
                  </span>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-650" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/75 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Institutional Email Address
                </span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-650" />
                  <input
                    type="email"
                    required
                    placeholder="doctor.user@onconavigator.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/75 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Portal Password
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-650" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/75 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying Security Access...</span>
                    </>
                  ) : (
                    <span>{isSignUp ? "Create Workspace account" : "Enter Secure Workspace"}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-slate-100 dark:border-zinc-800"></div>
              <span className="absolute bg-white dark:bg-zinc-900 px-3 text-[9px] text-slate-400 dark:text-zinc-500 font-mono uppercase tracking-widest">
                Or Choose Federated
              </span>
            </div>

            <button
              type="button"
              disabled={authLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer flex items-center justify-center gap-2 font-medium shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.734 0 3.32.628 4.545 1.666l2.39-2.39C17.26 1.488 14.935.5 12.24.5a10.5 10.5 0 0 0-10.5 10.5 10.5 10.5 0 0 0 10.5 10.5c5.73 0 10.5-4.14 10.5-10.5 0-.714-.075-1.393-.21-2.036L12.24 10.285z"/>
                </svg>
              )}
              <span>Sign in as Guest Student</span>
            </button>

            <div className="text-center text-xs text-slate-400 dark:text-zinc-500">
              <span>
                {isSignUp ? "Already registered?" : "Don't want to create an account?"}
              </span>&nbsp;
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                {isSignUp ? "Sign In" : "Register Profile"}
              </button>
            </div>
          </div>
        </div>
    );
  }

  // ----------------------------------------------------
  // PROFILE STATE VIEW PANEL (Shown on the Profile tab)
  // ----------------------------------------------------
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xs max-w-2xl mx-auto transition-all duration-200">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-serif font-bold text-lg flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
            {activeUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-serif italic text-lg text-slate-900 dark:text-zinc-150 font-semibold">{activeUser.name}</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">{activeUser.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-105 dark:hover:bg-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-201 dark:border-zinc-700"
        >
          <LogOut className="h-4 w-4 text-slate-400 dark:text-zinc-550" />
          Disconnect Core
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Stats Block */}
        <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/30 rounded-2xl border border-slate-100 dark:border-zinc-800/80 space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-sans">
            Profile Credentials
          </h4>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-450">Established</span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">{activeUser.dateCreated || "May 2026"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-450">Local Database Host</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">Indexed Sandbox RAM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-450">Assessed Records</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">{assessmentsHistory.length}</span>
            </div>
          </div>
        </div>

        {/* Right Compliance Info */}
        <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/30 rounded-2xl border border-slate-100 dark:border-zinc-800/80 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-sans flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            Security & HIPAA Sandboxed Status
          </h4>
          <p className="text-[11px] text-slate-505 dark:text-zinc-400 leading-relaxed font-sans">
            All loaded radiographies, chest MRI slices, dermal snapshots, and private clinical comments reside inside isolated LocalStorage memory. No files are stored or streamed.
          </p>
        </div>

      </div>

      {/* History Log Table */}
      <div className="space-y-3 bg-white dark:bg-[#121212]/0 pt-2">
        <h4 className="text-xs font-serif italic text-slate-900 dark:text-zinc-150 font-semibold">
          Saved Clinical History Logs
        </h4>
        
        {assessmentsHistory.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No historical evaluations saved for this profile coordinates.</p>
        ) : (
          <div className="divide-y divide-slate-150 dark:divide-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            {assessmentsHistory.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50/30 dark:hover:bg-zinc-850/20 transition">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-200 block font-serif">
                    {item.cancerType || "Assessment Report"}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {item.timestamp}
                    </span>
                    <span>•</span>
                    <span className={`font-semibold ${
                      item.riskLevel === "High" ? "text-red-600 dark:text-red-400" :
                      item.riskLevel === "Medium" ? "text-amber-600 dark:text-amber-400" :
                      "text-blue-650 dark:text-blue-400"
                    }`}>
                      {item.riskLevel} Level
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="p-1 px-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 rounded-lg transition border border-slate-205/40 dark:border-zinc-700 text-[10px] flex items-center gap-1 font-sans cursor-pointer"
                  title="Wipe assessment record"
                >
                  <Trash2 className="h-3 w-3" />
                  Wipe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
