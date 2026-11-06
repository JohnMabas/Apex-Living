"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Cookie, Settings2 } from "lucide-react";
import type { CookieConsent } from "@/types";

const STORAGE_KEY = "nestora_cookie_consent";

const defaultConsent: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Manage preferences modal
// ---------------------------------------------------------------------------

interface ManageModalProps {
  current: CookieConsent;
  onSave: (c: CookieConsent) => void;
  onClose: () => void;
}

function ManageModal({ current, onSave, onClose }: ManageModalProps) {
  const [prefs, setPrefs] = useState<CookieConsent>(current);

  const toggle = (key: keyof Omit<CookieConsent, "necessary">) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const categories: {
    key: keyof CookieConsent;
    label: string;
    description: string;
    locked?: boolean;
  }[] = [
    {
      key: "necessary",
      label: "Strictly Necessary",
      description:
        "Required for authentication and core platform functionality. Cannot be disabled.",
      locked: true,
    },
    {
      key: "functional",
      label: "Functional",
      description:
        "Remember your preferences and UI settings across visits.",
    },
    {
      key: "analytics",
      label: "Analytics",
      description:
        "Help us understand how our platform is used. Not currently active.",
    },
    {
      key: "marketing",
      label: "Marketing",
      description:
        "Enable personalised advertising. Not currently used.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-charcoal/8">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-forest-green" />
            <h2 className="font-display text-base font-semibold text-forest-green">
              Cookie Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal/40 hover:text-charcoal/70 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {categories.map(({ key, label, description, locked }) => (
            <div key={key} className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">{label}</p>
                <p className="text-xs text-charcoal/55 mt-0.5 leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                {locked ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    Always On
                  </span>
                ) : (
                  <button
                    role="switch"
                    aria-checked={prefs[key as keyof CookieConsent]}
                    onClick={() =>
                      toggle(key as keyof Omit<CookieConsent, "necessary">)
                    }
                    className={[
                      "relative inline-flex w-10 h-5 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:ring-offset-1",
                      prefs[key as keyof CookieConsent]
                        ? "bg-forest-green"
                        : "bg-charcoal/20",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform",
                        prefs[key as keyof CookieConsent]
                          ? "translate-x-5"
                          : "translate-x-0.5",
                      ].join(" ")}
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-charcoal/8">
          <button
            onClick={() => onSave(prefs)}
            className="flex-1 rounded-lg bg-forest-green px-4 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Save Preferences
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main banner component
// ---------------------------------------------------------------------------

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPrefs, setCurrentPrefs] = useState<CookieConsent>(defaultConsent);

  // Only check localStorage on the client
  useEffect(() => {
    const stored = loadConsent();
    if (!stored) {
      setVisible(true);
    } else {
      setCurrentPrefs(stored);
    }
  }, []);

  const acceptAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(consent);
    setCurrentPrefs(consent);
    setVisible(false);
  };

  const rejectOptional = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(consent);
    setCurrentPrefs(consent);
    setVisible(false);
  };

  const handleSavePrefs = (consent: CookieConsent) => {
    const finalConsent = { ...consent, necessary: true };
    saveConsent(finalConsent);
    setCurrentPrefs(finalConsent);
    setShowModal(false);
    setVisible(false);
  };

  // Don't render anything if consent is already set
  if (!visible && !showModal) return null;

  return (
    <>
      {/* Manage preferences modal */}
      {showModal && (
        <ManageModal
          current={currentPrefs}
          onSave={handleSavePrefs}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Cookie banner */}
      {visible && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-[9998] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-charcoal/10 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Icon + text */}
              <div className="flex items-start gap-4 flex-1">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/10 shrink-0">
                  <Cookie size={20} className="text-forest-green" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal mb-1">
                    We use cookies
                  </p>
                  <p className="text-xs text-charcoal/60 leading-relaxed">
                    Nestora uses cookies to keep you signed in and improve your
                    experience. By clicking &ldquo;Accept All&rdquo; you consent to all
                    cookie categories. See our{" "}
                    <Link
                      href="/cookie-policy"
                      className="underline hover:text-forest-green transition-colors"
                    >
                      Cookie Policy
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-lg border border-charcoal/20 px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  <Settings2 size={13} className="inline mr-1.5" />
                  Manage
                </button>
                <button
                  onClick={rejectOptional}
                  className="rounded-lg border border-charcoal/20 px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  Reject Optional
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-lg bg-forest-green px-3.5 py-2 text-xs font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
