// src/EventServices.jsx
import React, { useMemo, useState, useEffect } from "react";
import AuthModal from "./components/AuthModal.jsx";
import { watchUser, logout as fbLogout } from "./lib/firebase";

const IconLogin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="10" cy="8" r="3" strokeWidth="2" />
    <path d="M4 20c0-3 3-5 6-5" strokeWidth="2" strokeLinecap="round" />
    <rect x="14" y="12" width="7" height="5" rx="1.2" strokeWidth="2" />
    <path d="M16 14h3" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

const IconLogout = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" strokeWidth="2" />
    <path d="M15 7l5 5-5 5" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12H9" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ===== DATA ===== */
const EVENT_SERVICES = [
  {
    id: "cinemagic",
    name: "CineMagic Crew",
    emoji: "🎬",
    category: "Photography & Video",
    rate: 1500,
    pricingType: "package",
    tagline: "Turn your event into a cinematic memory.",
    services: ["Cinematic videography", "Full-day coverage", "Editing & color"],
  },
  {
    id: "daysaver",
    name: "DaySaver (On-the-day Coordinator)",
    emoji: "🕰️",
    category: "Event Planning",
    rate: 100,
    pricingType: "hourly",
    tagline: "Your event’s calm in the storm.",
    services: [
      "Flow control on the day",
      "Vendor check-in",
      "Guest management",
    ],
  },
  {
    id: "delishserve",
    name: "DelishServe",
    emoji: "🍽️",
    category: "Catering",
    rate: 35,
    pricingType: "perPax",
    minPax: 50,
    tagline: "Tastes that tell a story.",
    services: ["Buffet (local/western)", "Live stations", "Staff & setup"],
  },
  {
    id: "perfect-planner",
    name: "Perfect Planner",
    emoji: "📋",
    category: "Event Planning",
    rate: 120,
    pricingType: "hourly",
    tagline: "We handle the chaos so you can enjoy the moment.",
    services: [
      "Full coordination",
      "Vendor sourcing & timeline",
      "Budgeting & run sheet",
    ],
  },
  {
    id: "flora-lights",
    name: "Flora & Lights",
    emoji: "💐",
    category: "Decoration & Setup",
    rate: 150,
    pricingType: "hourly",
    tagline: "We make your venue picture-perfect.",
    services: ["Backdrop & florals", "Balloon decor", "Table styling"],
  },
  {
    id: "themetouch",
    name: "ThemeTouch",
    emoji: "🎀",
    category: "Decoration & Setup",
    rate: 450,
    pricingType: "package",
    includedHours: 3,
    extraRate: 100,
    tagline: "You dream it, we design it.",
    services: [
      "Custom theme setup (3 hours included)",
      "Kids party or proposal styling",
      "Extra time billed at RM100/hour",
    ],
  },
  {
    id: "snapstory",
    name: "SnapStory Studio",
    emoji: "📸",
    category: "Photography & Video",
    rate: 180,
    pricingType: "hourly",
    tagline: "Capture moments that last forever.",
    services: ["Event photography", "Highlights reel", "Edited gallery"],
  },
  {
    id: "dj-vibepro",
    name: "DJ VibePro",
    emoji: "🎧",
    category: "Entertainment",
    rate: 280,
    pricingType: "hourly",
    tagline: "We bring the beats. You bring the crowd.",
    services: ["Party/Corporate DJ", "MC add-on (optional)", "Basic lighting"],
  },
  {
    id: "kidszone",
    name: "KidsZone Crew",
    emoji: "🎈",
    category: "Entertainment",
    rate: 12,
    pricingType: "perPax",
    minPax: 15,
    tagline: "Smiles guaranteed for every child.",
    services: ["Clown & games", "Face painting", "Balloon twisting"],
  },
  {
    id: "photobooth-fun",
    name: "Photo Booth Fun",
    emoji: "📷",
    category: "Special Add-ons",
    rate: 550,
    pricingType: "package",
    includedHours: 2,
    extraRate: 100,
    printsIncluded: 100,
    extraPerPrint: 2,
    printsPerPersonHint: 2,
    tagline: "Snap. Print. Smile.",
    services: [
      "2-hour photo booth with instant prints",
      "Props & custom backdrop included",
      "Extra hour RM100 (optional)",
      "Includes 100 total prints (RM2/extra print)",
    ],
  },
  {
    id: "gift-guru",
    name: "Gift & Door Prize Setup",
    emoji: "🎁",
    category: "Special Add-ons",
    rate: 8,
    pricingType: "perPax",
    minPax: 50,
    tagline: "Small gifts, big memories.",
    services: ["Personalized souvenirs", "Packing & labeling", "Guest table"],
  },
  {
    id: "pro-emcee",
    name: "Event Host / Emcee",
    emoji: "🎤",
    category: "Special Add-ons",
    rate: 180,
    pricingType: "hourly",
    tagline: "Your event’s voice, your guests’ energy.",
    services: ["Professional hosting", "Agenda flow", "Audience engagement"],
  },
];

/* ===== HELPERS ===== */
function unitSuffix(pt) {
  if (pt === "hourly") return "/hr";
  if (pt === "perPax") return "/pax";
  return "";
}
function finalUnitPrice(rate, discountEligible) {
  return discountEligible ? Math.round(rate * 0.7) : rate;
}
function estimateTotal(service, unitPrice, qty) {
  if (service.pricingType === "package") return unitPrice;
  const q = Number(qty || 0);
  return q > 0 ? unitPrice * q : unitPrice;
}

/* ===== KV SURCHARGE (Flat RM50 if outside/unknown) ===== */
const FLAT_SURCHARGE = 50;
const inRange = (pc, a, b) => {
  const n = Number(pc);
  return !Number.isNaN(n) && n >= a && n <= b;
};
function inferKV(postcode) {
  const pc = String(postcode || "").trim();
  if (!/^\d{5}$/.test(pc)) return { inKV: null, reason: "Invalid postcode" };
  const rules = [
    { test: (p) => inRange(p, 50000, 60000), inKV: true }, // KL
    { test: (p) => String(p).startsWith("620"), inKV: true }, // Putrajaya
    { test: (p) => String(p).startsWith("46"), inKV: true }, // PJ
    { test: (p) => inRange(p, 47000, 47639), inKV: true }, // Puchong/Subang
    { test: (p) => String(p).startsWith("478"), inKV: true }, // Kota Damansara
    { test: (p) => inRange(p, 40000, 40499), inKV: true }, // Shah Alam
    { test: (p) => inRange(p, 41000, 42199), inKV: true }, // Klang
    { test: (p) => String(p).startsWith("681"), inKV: true }, // Gombak
    { test: (p) => p === "48000", inKV: true }, // Rawang
    { test: (p) => inRange(p, 43000, 43699), inKV: true }, // Hulu Langat
    { test: (p) => String(p).startsWith("630") || p === "43900", inKV: true }, // Sepang
    { test: (p) => String(p).startsWith("450"), inKV: false }, // Kuala Selangor
    { test: (p) => String(p).startsWith("452"), inKV: false }, // Sabak Bernam
  ];
  for (const r of rules)
    if (r.test(pc)) return { inKV: r.inKV, reason: "Matched" };
  return { inKV: null, reason: "Unknown" };
}
function computeSurcharge(postcode) {
  const { inKV } = inferKV(postcode);
  if (inKV === true) return 0;
  return FLAT_SURCHARGE;
}

/* ===== LOCAL STORAGE KEYS (demo cart/bookings) ===== */
const CART_KEY = "event.cart.v1";
const BOOKINGS_KEY = "event.bookings.v1";
const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};
const saveCart = (v) => localStorage.setItem(CART_KEY, JSON.stringify(v));
const loadBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
  } catch {
    return [];
  }
};
const saveBookings = (v) =>
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(v));

/* ===== Tooltip (shared) ===== */
function Tooltip({ children, text, disabled }) {
  return (
    <div className="relative group inline-block">
      {children}
      {!disabled && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-[220px] text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, onBook, discountEligible, user }) {
  const [showDetails, setShowDetails] = useState(false);

  const unit = finalUnitPrice(service.rate, discountEligible);
  const suffix = unitSuffix(service.pricingType);

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-xl transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: emoji + name/category */}
        <div className="flex items-start gap-3">
          <div className="text-4xl sm:text-3xl leading-none" aria-hidden="true">
            {service.emoji}
          </div>
          <div>
            {/* Name */}
            <h3 className="text-[0.8rem] sm:text-[0.9rem] font-semibold">
              {service.name}
            </h3>
            {/* Category */}
            <p className="text-[0.75rem] text-slate-400">{service.category}</p>
          </div>
        </div>

        {/* Rate */}
        <div className="text-right shrink-0">
          {discountEligible ? (
            <div className="flex flex-col items-end">
              <span className="text-slate-500 line-through text-[0.8rem] sm:text-[0.9rem]">
                RM {service.rate}
                {suffix}
              </span>
              <span className="text-emerald-400 font-semibold text-[0.8rem] sm:text-[0.9rem]">
                RM {unit}
                {suffix}
              </span>
            </div>
          ) : (
            <span className="text-indigo-400 font-semibold text-[0.8rem] sm:text-[0.9rem]">
              RM {unit}
              {suffix}
            </span>
          )}
        </div>
      </div>

      {/* Discount flag */}
      {discountEligible && (
        <div className="mt-2 inline-flex items-center gap-2 text-emerald-300 text-[0.75rem] bg-emerald-900/30 border border-emerald-800 px-2 py-1 rounded-md">
          <span>❤</span> <span>Compassionate 30% off active</span>
        </div>
      )}

      {/* Min pax note */}
      {service.pricingType === "perPax" && service.minPax && (
        <div className="mt-2 text-[0.75rem] text-slate-400">
          Minimum {service.minPax} pax
        </div>
      )}

      {/* Tagline */}
      <p className="mt-2 text-[0.8rem] sm:text-[0.9rem] text-slate-300">
        {service.tagline}
      </p>

      {/* Collapsible services */}
      {showDetails && (
        <ul className="mt-2 sm:mt-3 text-[0.8rem] sm:text-[0.9rem] space-y-1.5">
          {service.services.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-slate-500 leading-6">•</span>
              <span className="leading-6">{s}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Toggle details (indigo in dark, orange in day) */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="mt-3 text-[0.8rem] text-indigo-400 details-link hover:underline self-start sm:self-auto"
      >
        {showDetails ? "Hide details ▲" : "More details ▼"}
      </button>

      {/* Spacer so CTA hugs bottom */}
      <div className="mt-3 flex-1" />

      {/* CTA with Tooltip (kept) */}
      <Tooltip text="Please log in to add items to your cart" disabled={!!user}>
        <button
          onClick={() => {
            if (user) onBook(service);
          }}
          className={`mt-3 h-11 w-full sm:w-auto rounded-xl px-5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            user
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-indigo-600/50 cursor-not-allowed"
          }`}
        >
          Add to Cart
        </button>
      </Tooltip>
    </article>
  );
}

/* ===== Modal (unchanged logic except textarea no longer 'required' if you want it optional) ===== */
function Modal({
  open,
  service,
  finalRate,
  discountEligible,
  requireAddressConfirm,
  onClose,
  onSubmit,
}) {
  const [occasion, setOccasion] = useState("");
  const [datetime, setDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [payment, setPayment] = useState("cash");
  const [note, setNote] = useState(""); // optional per your latest ask
  const [qty, setQty] = useState("");
  const [extraHours, setExtraHours] = useState("");
  const [extraPrints, setExtraPrints] = useState("");

  const [postcode, setPostcode] = useState("");
  const [addressConfirm, setAddressConfirm] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");

  if (!open || !service) return null;

  const isHourly = service.pricingType === "hourly";
  const isPerPax = service.pricingType === "perPax";
  const isPackage = service.pricingType === "package";
  const isPhotoBooth = service.id === "photobooth-fun";

  const qtyLabel = isHourly
    ? "Estimated duration (hours)"
    : isPerPax
    ? "Guest count (pax)"
    : "";
  const qtyPlaceholder = isHourly
    ? "e.g. 4"
    : isPerPax
    ? `e.g. ${service.minPax || 50}`
    : "";
  const unitSuffixLabel = unitSuffix(service.pricingType);

  const extraHoursNum = Number(extraHours || 0);
  const extraPrintsNum = Number(extraPrints || 0);
  const extraHoursCost =
    isPackage && service.extraRate ? extraHoursNum * service.extraRate : 0;
  const extraPrintsCost =
    isPhotoBooth && service.extraPerPrint
      ? extraPrintsNum * service.extraPerPrint
      : 0;

  const numericQty = qty ? Number(qty) : 0;
  const meetsMin = isPerPax ? numericQty >= (service.minPax || 0) : true;

  const baseUnit = finalRate;
  const baseTotal = isPackage
    ? baseUnit + extraHoursCost + extraPrintsCost
    : numericQty > 0
    ? baseUnit * numericQty
    : 0;

  const surcharge = computeSurcharge(postcode);
  const estTotal = baseTotal + surcharge;

  const addDisabled =
    (!isPackage && !qty) ||
    !datetime ||
    !location ||
    (requireAddressConfirm &&
      (!addressConfirm || !orgName.trim() || !orgAddress.trim()));

  function submit(e) {
    e.preventDefault();
    if (addDisabled) return;
    onSubmit({
      occasion,
      datetime,
      location,
      payment,
      note,
      qty: isPackage ? 1 : Number(qty),
      extraHours: isPackage ? Number(extraHours || 0) : 0,
      extraPrints: isPhotoBooth ? Number(extraPrints || 0) : 0,
      postcode,
      surcharge,
      orgName: requireAddressConfirm ? orgName.trim() : "",
      orgAddress: requireAddressConfirm ? orgAddress.trim() : "",
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      () => {}
    );
  }

  const kv = inferKV(postcode).inKV;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold">
            Add <span className="text-indigo-400">{service.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          className="p-5 space-y-3 overflow-y-auto flex-1"
          onSubmit={submit}
        >
          <div className="text-sm text-slate-300 space-y-1">
            <div>
              {discountEligible ? (
                <>
                  Compassionate discount{" "}
                  <span className="text-emerald-400 font-semibold">
                    30% off
                  </span>{" "}
                  applied to base{" "}
                  {service.pricingType === "package" ? "package" : "rate"}.
                </>
              ) : (
                "Standard rate."
              )}
            </div>
            <div>
              Unit price:{" "}
              <span className="font-semibold text-indigo-300">
                RM {finalRate}
                {unitSuffixLabel}
              </span>
            </div>
          </div>

          {!isPackage && (
            <div className="mt-1">
              <label className="block text-sm text-slate-400 mb-1">
                {qtyLabel}
              </label>
              <input
                required
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={qtyPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
              />
              {isPerPax && service.minPax && (
                <p
                  className={`mt-1 text-xs ${
                    meetsMin ? "text-slate-500" : "text-rose-400"
                  }`}
                >
                  Minimum {service.minPax} pax {meetsMin ? "met" : "not met"}.
                </p>
              )}
            </div>
          )}

          <label className="block text-sm text-slate-400">
            Occasion (optional)
          </label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
          >
            <option value="">— Select —</option>
            <option value="birthday">Birthday</option>
            <option value="wedding">Wedding / Engagement</option>
            <option value="corporate">Corporate Function</option>
            <option value="graduation">Graduation</option>
            <option value="orphanage">Orphanage</option>
            <option value="nursing_home">Nursing Home (Elderly)</option>
            <option value="other">Other Special Occasion</option>
          </select>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="(Optional) Extra details like theme, guests, budget, vibes"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 h-24"
          />

          <label className="block text-sm text-slate-400">
            Preferred date & time
          </label>
          <div className="flex gap-2">
            <input
              required
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
            />
          </div>

          <label className="block text-sm text-slate-400">Location</label>
          <div className="flex gap-2">
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue address or coordinates"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 text-sm"
            >
              Use my location
            </button>
          </div>

          {requireAddressConfirm && (
            <div className="grid gap-2">
              <label className="block text-sm text-slate-400">
                Organization name
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Rumah Anak Yatim ABC"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
                required
              />
              <label className="block text-sm text-slate-400">
                Registered address
              </label>
              <textarea
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                placeholder="Street, postcode, city, state"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 h-20"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Postcode
              </label>
              <input
                inputMode="numeric"
                maxLength={5}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. 59200"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <span
                className={`text-xs px-2 py-1 rounded-md border ${
                  inferKV(postcode).inKV === true
                    ? "text-emerald-600 bg-emerald-900/20 border-emerald-800"
                    : "text-amber-500 bg-amber-900/20 border-amber-800"
                }`}
              >
                {inferKV(postcode).inKV === true
                  ? "Klang Valley — Yes (no surcharge)"
                  : inferKV(postcode).inKV === false
                  ? `Klang Valley — No (RM${FLAT_SURCHARGE} surcharge)`
                  : `Klang Valley — Uncertain (RM${FLAT_SURCHARGE} temp surcharge)`}
              </span>
            </div>
          </div>

          {requireAddressConfirm && (
            <label className="flex items-start gap-2 text-xs bg-slate-800/40 border border-slate-700 rounded-lg p-2">
              <input
                type="checkbox"
                className="mt-0.5 accent-indigo-600"
                checked={addressConfirm}
                onChange={(e) => setAddressConfirm(e.target.checked)}
              />
              <span>
                I confirm the event venue matches the registered address of the
                orphanage / nursing home. I understand the discount is void and
                checkout is blocked if the venue differs.
              </span>
            </label>
          )}
        </form>

        <div className="border-t border-slate-800 p-5 sticky bottom-0 bg-slate-900 rounded-b-2xl">
          <div className="mb-2 text-sm">
            Estimated total:{" "}
            <span className="font-semibold text-emerald-400">
              {estTotal > 0 ? `RM ${estTotal}` : "—"}
            </span>
            {surcharge > 0 && (
              <span className="ml-2 text-xs text-slate-400">
                (includes RM{surcharge} outside/unknown KV surcharge)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Extra charges may apply: overtime beyond agreed hours, additional
            pax beyond package, or travel beyond 20 km radius. Discount valid
            only when the event is held at the exact orphanage/nursing home
            address provided; otherwise the discount is void.
          </p>
          <button
            onClick={submit}
            disabled={addDisabled}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-2 font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Toast ===== */
function Toast({ show, children }) {
  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 transition-all ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  );
}

/* ===== Cart Drawer ===== */
function CartDrawer({
  open,
  items,
  onClose,
  onRemove,
  onChange,
  onCheckout,
  subtotal,
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">🛒 My Cart</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-200px)]">
          {items.length === 0 && (
            <p className="text-sm text-slate-400">Your cart is empty.</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="border border-slate-800 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{it.serviceName}</div>
                  <div className="text-xs text-slate-500">
                    {it.datetime} • {it.location}
                  </div>
                  <div className="text-xs text-slate-500">
                    Postcode: {it.postcode || "-"}
                  </div>
                  {(it.orgName || it.orgAddress) && (
                    <div className="text-xs text-slate-500">
                      {it.orgName ? <>Org: {it.orgName} • </> : null}
                      {it.orgAddress ? (
                        <>Reg. address: {it.orgAddress}</>
                      ) : null}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    Payment: {it.payment}
                  </div>

                  {it.pricingType !== "package" && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-slate-400">
                        Qty ({it.pricingType === "hourly" ? "hr" : "pax"})
                      </span>
                      <div className="inline-flex items-center border border-slate-700 rounded-md overflow-hidden">
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            onChange(it.id, {
                              qty: Math.max(1, (it.qty || 1) - 1),
                            })
                          }
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-slate-900">
                          {it.qty || 1}
                        </span>
                        <button
                          className="px-2 py-1"
                          onClick={() =>
                            onChange(it.id, { qty: (it.qty || 1) + 1 })
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {it.pricingType === "package" && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {typeof it.extraHours === "number" && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Extra hours</span>
                          <div className="inline-flex items-center border border-slate-700 rounded-md overflow-hidden">
                            <button
                              className="px-2 py-1"
                              onClick={() =>
                                onChange(it.id, {
                                  extraHours: Math.max(
                                    0,
                                    (it.extraHours || 0) - 1
                                  ),
                                })
                              }
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-slate-900">
                              {it.extraHours || 0}
                            </span>
                            <button
                              className="px-2 py-1"
                              onClick={() =>
                                onChange(it.id, {
                                  extraHours: (it.extraHours || 0) + 1,
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                      {typeof it.extraPrints === "number" && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Extra prints</span>
                          <div className="inline-flex items-center border border-slate-700 rounded-md overflow-hidden">
                            <button
                              className="px-2 py-1"
                              onClick={() =>
                                onChange(it.id, {
                                  extraPrints: Math.max(
                                    0,
                                    (it.extraPrints || 0) - 5
                                  ),
                                })
                              }
                            >
                              -
                            </button>
                            <span className="px-3 py-1 bg-slate-900">
                              {it.extraPrints || 0}
                            </span>
                            <button
                              className="px-2 py-1"
                              onClick={() =>
                                onChange(it.id, {
                                  extraPrints: (it.extraPrints || 0) + 5,
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">
                    Unit: RM {it.unitPrice}
                    {unitSuffix(it.pricingType)}
                  </div>
                  {it.surcharge > 0 && (
                    <div className="text-[11px] text-slate-400">
                      Surcharge: RM {it.surcharge}
                    </div>
                  )}
                  <div className="font-semibold text-emerald-400">
                    RM {it.price}
                  </div>
                  <button
                    className="mt-2 text-rose-400 text-sm underline"
                    onClick={() => onRemove(it.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="font-semibold text-emerald-400">
              RM {subtotal}
            </span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-2 font-medium"
          >
            Checkout
          </button>
          <p className="text-[11px] text-slate-500">
            This is a demo checkout. Items will be moved to "My Bookings".
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ===== PAGE ===== */
export default function EventServices() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [modalService, setModalService] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const [occasionTop, setOccasionTop] = useState("");
  const discountEligible = ["orphanage", "nursing_home"].includes(occasionTop);
  const requireAddressConfirm = discountEligible;

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(() => loadCart());
  const [bkRefresh, setBkRefresh] = useState(0);

  // THEME (persisted)
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsub = watchUser((u) => setUser(u));
    return () => unsub && unsub();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(EVENT_SERVICES.map((s) => s.category))).sort(),
    []
  );
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = EVENT_SERVICES.filter(
      (s) => !category || s.category === category
    );
    if (q)
      res = res.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.services.join(" ").toLowerCase().includes(q)
      );
    res.sort((a, b) =>
      sort === "rate" ? a.rate - b.rate : a.name.localeCompare(b.name)
    );
    return res;
  }, [query, category, sort]);

  const getFinalRate = (service) =>
    finalUnitPrice(service.rate, discountEligible);

  function handleAddToCart(extra) {
    const svc = modalService;
    if (!svc) return;
    const unit = getFinalRate(svc);
    let base;
    if (svc.pricingType === "package") {
      base =
        unit +
        (svc.extraRate || 0) * (extra?.extraHours || 0) +
        (svc.id === "photobooth-fun"
          ? (svc.extraPerPrint || 0) * (extra?.extraPrints || 0)
          : 0);
    } else {
      base = estimateTotal(svc, unit, extra?.qty);
    }
    const surcharge = computeSurcharge(extra?.postcode);
    const total = base + surcharge;

    const item = {
      id: crypto.randomUUID(),
      serviceId: svc.id,
      serviceName: svc.name,
      pricingType: svc.pricingType,
      unitPrice: unit,
      qty: svc.pricingType === "package" ? 1 : Number(extra?.qty || 1),
      price: total,
      surcharge,
      postcode: extra?.postcode || "",
      discount: discountEligible ? 0.3 : 0,
      occasion: extra?.occasion || "",
      datetime: extra?.datetime || "",
      location: extra?.location || "",
      payment: extra?.payment || "cash",
      note: extra?.note || "",
      orgName: extra?.orgName || "",
      orgAddress: extra?.orgAddress || "",
      extraHours: extra?.extraHours || 0,
      extraPrints: extra?.extraPrints || 0,
      includedHours: svc?.includedHours,
      printsIncluded: svc?.printsIncluded,
      extraRate: svc?.extraRate,
      extraPerPrint: svc?.extraPerPrint,
    };

    const next = [...cart, item];
    setCart(next);
    saveCart(next);
    setModalService(null);
    setCartOpen(true);
  }

  function recalc(it) {
    let base;
    if (it.pricingType === "package") {
      base =
        it.unitPrice +
        (it.extraRate || 0) * (it.extraHours || 0) +
        (it.extraPerPrint || 0) * (it.extraPrints || 0);
    } else {
      const q = Math.max(1, Number(it.qty || 1));
      base = it.unitPrice * q;
    }
    return base + (it.surcharge || 0);
  }
  function changeCartItem(id, patch) {
    const next = cart.map((c) =>
      c.id === id ? { ...c, ...patch, price: recalc({ ...c, ...patch }) } : c
    );
    setCart(next);
    saveCart(next);
  }
  function removeCartItem(id) {
    const next = cart.filter((c) => c.id !== id);
    setCart(next);
    saveCart(next);
  }
  const cartSubtotal = cart.reduce((sum, c) => sum + Number(c.price || 0), 0);

  function handleCheckout() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const bookings = loadBookings();
    const stamped = cart.map((c) => ({
      id: crypto.randomUUID(),
      user: { email: user.email, name: user.name },
      serviceId: c.serviceId,
      serviceName: c.serviceName,
      pricingType: c.pricingType,
      unitPrice: c.unitPrice,
      qty: c.pricingType === "package" ? 1 : c.qty,
      price: c.price,
      surcharge: c.surcharge || 0,
      postcode: c.postcode || "",
      discount: c.discount,
      occasion: c.occasion,
      datetime: c.datetime,
      location: c.location,
      payment: c.payment,
      note: c.note,
      orgName: c.orgName || "",
      orgAddress: c.orgAddress || "",
      extraHours: c.extraHours || 0,
      extraPrints: c.extraPrints || 0,
      includedHours: c.includedHours,
      printsIncluded: c.printsIncluded,
      extraRate: c.extraRate,
      extraPerPrint: c.extraPerPrint,
      status: "pending payment",
      createdAt: new Date().toISOString(),
    }));
    saveBookings([...bookings, ...stamped]);
    setCart([]);
    saveCart([]);
    setCartOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
    setBkRefresh((n) => n + 1);
  }
  function deleteBooking(id) {
    const all = loadBookings();
    const next = all.filter((b) => b.id !== id);
    saveBookings(next);
    setBkRefresh((n) => n + 1);
  }

  return (
    <div
      className={`${
        theme === "light" ? "light" : ""
      } min-h-screen bg-slate-950 text-slate-100`}
      style={{ fontFamily: "Poppins, ui-sans-serif, system-ui" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left (mobile: stacked) */}
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              🎉 Event & Special Occasion
            </h1>
            {/* Mobile tagline (desktop has its own on the right if you want) */}
            <p className="text-[0.7rem] text-white sm:hidden">
              “We plan, decorate & entertain—by appointment.”
            </p>
          </div>

          {/* Right actions: mobile icon row */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Cart */}
            <button
              onClick={() => user && setCartOpen(true)}
              aria-label="Open cart"
              className={`w-10 h-10 grid place-items-center rounded-xl ${
                user
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-slate-800/60 cursor-not-allowed"
              }`}
            >
              🛒
              {user && cart.length > 0 && (
                <span className="absolute -mt-8 ml-6 bg-emerald-600 text-white text-[0.7rem] rounded-full px-1.5 py-0.5">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Theme toggle (icon only on mobile; label appears ≥1440px if you kept that logic) */}
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Toggle day/night mode"
              className={`relative w-10 h-10 grid place-items-center rounded-xl ${
                theme === "light" ? "bg-slate-200" : "bg-slate-800"
              }`}
            >
              <span className="text-[1rem]">
                {theme === "light" ? "☀️" : "🌙"}
              </span>
            </button>

            {/* Auth */}
            {!user ? (
              /* BEFORE login: show person+card icon */
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Sign up / Log in"
                className="w-10 h-10 grid place-items-center rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                <IconLogin className="w-5 h-5 text-slate-100" />
              </button>
            ) : (
              /* AFTER login: show avatar + logout */
              <div className="flex items-center gap-2">
                <span
                  aria-label="Account"
                  className="w-10 h-10 grid place-items-center rounded-xl bg-slate-800 text-slate-100"
                  title={user.name || user.email}
                >
                  <IconUser className="w-5 h-5" />
                </span>
                <button
                  onClick={async () => {
                    await fbLogout();
                    setUser(null);
                    setCart([]);
                    saveCart([]);
                  }}
                  aria-label="Log out"
                  className="w-10 h-10 grid place-items-center rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  <IconLogout className="w-5 h-5 text-slate-100" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop/tablet tagline (optional) */}
        <div className="hidden sm:block max-w-6xl mx-auto px-4 pb-3">
          <p className="text-sm text-[#E5E7EB]">
            “We plan, decorate & entertain—by appointment.”
          </p>
        </div>
      </header>

      {/* Controls */}
      <main className="max-w-6xl mx-auto px-4 py-6 text-[0.8rem]">
        {/* Row 1 — Occasion FIRST */}
        <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Occasion:</label>
              <select
                value={occasionTop}
                onChange={(e) => setOccasionTop(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2"
              >
                <option value="">None</option>
                <option value="birthday">Birthday</option>
                <option value="wedding">Wedding / Engagement</option>
                <option value="corporate">Corporate</option>
                <option value="graduation">Graduation</option>
                <option value="orphanage">Orphanage</option>
                <option value="nursing_home">Nursing Home (Elderly)</option>
                <option value="other">Other Special Occasion</option>
              </select>
            </div>

            {discountEligible && (
              <span className="text-emerald-300 text-sm inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 px-2 py-1 rounded-md">
                ❤ Compassionate 30% off active
              </span>
            )}
          </div>

          <p className="mt-2 text-slate-500 disclaimer-text">
            Discount applies ONLY when the event is held at the exact orphanage
            / nursing home address provided later. If the venue differs on the
            event day, the discount is void. Events outside Klang Valley may
            incur extra charges.
          </p>
        </div>

        {/* Row 2 — Category/Sort */}
        <div className="grid sm:flex gap-3 sm:items-center sm:justify-between mb-6">
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2"
            >
              <option value="name">Sort: Name</option>
              <option value="rate">Sort: Rate</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              user={user}
              onBook={(svc) => setModalService(svc)}
              discountEligible={discountEligible}
            />
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-slate-500 footnote">
          Demo site for event services. Rates are estimates; final quote depends
          on scope, venue and date.
        </p>
        <p className="mt-2 text-slate-500 footnote">
          30% discount applies only for events at an <strong>Orphanage</strong>{" "}
          or a <strong>Nursing Home (Elderly)</strong>. Events outside Klang
          Valley may incur extra charges. Discount is valid only if the event
          takes place at the exact orphanage/nursing home address provided;
          otherwise the discount is void.
        </p>

        {/* Bookings viewer (demo) */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">
            My Bookings (demo)
          </h3>
          {!user ? (
            <p className="text-slate-500 bookings-note">
              Please log in to view your bookings.
            </p>
          ) : (
            <div className="text-xs text-slate-400 space-y-2">
              {loadBookings()
                .filter((b) => b.user?.email === user.email)
                .slice(-20)
                .reverse()
                .map((b) => (
                  <div
                    key={b.id}
                    className="border border-slate-800 rounded-lg p-3"
                  >
                    <div className="flex justify-between">
                      <span>
                        {b.serviceName}
                        {b.pricingType !== "package" && b.qty ? (
                          <span className="text-slate-500">
                            {" "}
                            • {b.qty}{" "}
                            {b.pricingType === "hourly" ? "hr" : "pax"} @ RM{" "}
                            {b.unitPrice}
                          </span>
                        ) : null}
                        {b.pricingType === "package" ? (
                          <span className="text-slate-500">
                            {b.includedHours
                              ? ` • includes ${b.includedHours}h`
                              : ""}
                            {b.extraHours ? ` + ${b.extraHours}h extra` : ""}
                            {b.printsIncluded
                              ? ` • ${b.printsIncluded} prints inc.`
                              : ""}
                            {b.extraPrints
                              ? ` + ${b.extraPrints} prints extra`
                              : ""}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-emerald-400">RM {b.price}</span>
                    </div>
                    <div>
                      {b.datetime} • {b.location}
                    </div>
                    {(b.orgName || b.orgAddress) && (
                      <div className="text-slate-500">
                        {b.orgName ? <>Org: {b.orgName} • </> : null}
                        {b.orgAddress ? (
                          <>Reg. address: {b.orgAddress}</>
                        ) : null}
                      </div>
                    )}
                    <div className="text-slate-500">
                      Postcode: {b.postcode || "-"} • Surcharge: RM{" "}
                      {b.surcharge || 0}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-slate-500">
                        Payment: {b.payment} • <strong>{b.status}</strong>
                      </div>
                      <button
                        className="text-rose-400 underline"
                        onClick={() => deleteBooking(b.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <Modal
        open={!!modalService}
        service={modalService}
        finalRate={modalService ? getFinalRate(modalService) : undefined}
        discountEligible={discountEligible}
        requireAddressConfirm={requireAddressConfirm}
        onClose={() => setModalService(null)}
        onSubmit={handleAddToCart}
      />
      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onRemove={removeCartItem}
        onChange={changeCartItem}
        onCheckout={handleCheckout}
        subtotal={cartSubtotal}
      />
      <AuthModal
        open={authOpen}
        mode="login"
        onClose={() => setAuthOpen(false)}
        onAuthed={(u) => {
          setUser(u);
          setAuthOpen(false);
        }}
      />
      <Toast show={showToast}>
        Order placed!{" "}
        {discountEligible ? "Compassionate discount applied. " : ""}We’ll be in
        touch soon. ✨
      </Toast>
    </div>
  );
}
