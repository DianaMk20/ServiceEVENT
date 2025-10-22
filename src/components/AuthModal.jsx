// src/components/AuthModal.jsx
import React, { useState } from "react";
import { signupWithName, loginEmail, resetPassword } from "../lib/firebase";

export default function AuthModal({ open, mode = "login", onClose, onAuthed }) {
  const [tab, setTab] = useState(mode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const user =
        tab === "signup"
          ? await signupWithName(email, pass, name.trim())
          : await loginEmail(email, pass);

      onAuthed && onAuthed(user);
    } catch (e) {
      setErr(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setErr("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e) {
      setErr(e.message || "Could not send reset email");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex gap-3 text-sm">
            <button
              onClick={() => {
                setTab("login");
                setShowReset(false);
              }}
              className={`px-2 py-1 rounded ${
                tab === "login" ? "bg-slate-800" : ""
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => {
                setTab("signup");
                setShowReset(false);
              }}
              className={`px-2 py-1 rounded ${
                tab === "signup" ? "bg-slate-800" : ""
              }`}
            >
              Sign up
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {tab === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
          />

          {!showReset && (
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Password"
              required={tab === "login" || tab === "signup"}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
            />
          )}

          {err && <div className="text-rose-400 text-sm">{err}</div>}

          {showReset ? (
            <>
              {resetSent ? (
                <div className="text-emerald-400 text-sm">
                  Reset email sent. Check your inbox.
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl px-3 py-2 font-medium"
                >
                  Send reset email
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-sm underline mt-2"
              >
                Back to login
              </button>
            </>
          ) : (
            <>
              <button
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl px-3 py-2 font-medium"
              >
                {tab === "signup" ? "Create account" : "Log in"}
              </button>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="w-full text-sm underline"
                >
                  Forgot your password?
                </button>
              )}
            </>
          )}

          <p className="text-[11px] text-slate-500">
            By continuing, you agree to our terms and privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
}
