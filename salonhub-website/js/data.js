/* ============================================================
   SalonHub — seed data & local "database" (localStorage-backed)
   This simulates a backend for demo purposes. Swap this file's
   read/write functions for real API calls when you add a server.
   ============================================================ */

const DB_KEYS = {
  users: "salonhub_users",
  bookings: "salonhub_bookings",
  session: "salonhub_session",
  seeded: "salonhub_seeded_v3"
};

const HOUSECALL_CATEGORIES = ["Makeup Artist", "Barber", "Nail Technician", "Braider"];

const SALON_SERVICE_LIBRARY = [
  "Haircut & Style", "Colour & Highlights", "Blow Dry", "Relaxer Treatment",
  "Facial", "Manicure", "Pedicure", "Gel Nails", "Full Body Massage",
  "Waxing", "Makeup Application", "Braiding", "Locs Maintenance", "Bridal Package"
];

/* ---------- subscription plans (this is the core monetisation model) ---------- */
const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 149,
    tagline: "Get listed and start taking bookings.",
    features: ["Public listing on SalonHub", "Up to 5 services", "Email + SMS booking alerts", "Standard placement in search"]
  },
  {
    id: "growth",
    name: "Growth",
    price: 299,
    tagline: "For providers who are booked most weeks.",
    features: ["Everything in Starter", "Unlimited services", "Priority placement in search", "Booking analytics on your dashboard"]
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    tagline: "Top placement and a featured badge.",
    features: ["Everything in Growth", "\"Featured\" badge on your listing", "Top-of-search placement", "Early access to new SalonHub features"]
  }
];
function planById(id) { return SUBSCRIPTION_PLANS.find((p) => p.id === id) || null; }

function buildSeedSubscription(index) {
  // most providers are active subscribers on a mix of plans; a few are
  // inactive so the admin "subscriptions" view and the gating logic have
  // something real to show in the demo.
  if (index % 6 === 5) {
    return { planId: null, status: "inactive", startedAt: null, renewsAt: null };
  }
  const planId = SUBSCRIPTION_PLANS[index % SUBSCRIPTION_PLANS.length].id;
  const started = new Date();
  started.setDate(started.getDate() - (index * 3));
  const renews = new Date(started);
  renews.setDate(renews.getDate() + 30);
  return { planId, status: "active", startedAt: started.toISOString(), renewsAt: renews.toISOString() };
}

function avatar(seed) {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}
function coverImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/420`;
}

/* ---------- real portrait photos for the seeded house-call providers ----------
   Curated (via search) Pexels photos, explicitly gender-matched and depicting
   Black adults in their 20s-30s. Pexels' license permits free use, including
   in projects like this one. New house-call sign-ups (not seeded) start with
   a placeholder and can upload their own real photo from their dashboard. */
function pexelsPortrait(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
}
const HOUSECALL_PORTRAITS = {
  "Thandi Nkosi": pexelsPortrait(6311269),
  "Refilwe Seetsi": pexelsPortrait(5991144),
  "Naledi Mahlangu": pexelsPortrait(4816338),
  "Sipho Dlamini": pexelsPortrait(5282408),
  "Mzansi Cuts (Bongani)": pexelsPortrait(5984158),
  "Karabo Molefe": pexelsPortrait(33844626),
  "Amahle Zulu": pexelsPortrait(4297233),
  "Precious Adjei": pexelsPortrait(18789516),
  "Zanele Buthelezi": pexelsPortrait(7194457),
  "Lindiwe Mokoena": pexelsPortrait(9429449),
  "Kagiso Ramaboa": pexelsPortrait(20715518),
  "Crown Braids (Ayanda)": pexelsPortrait(11440539),
  "Zanele Adams": pexelsPortrait(18789516),
  "Boitumelo Kgosi": pexelsPortrait(7194457),
  "Themba Cele": pexelsPortrait(7389011),
  "Luthando Mzayiya": pexelsPortrait(6311272),
  "Lerato Mokgadi": pexelsPortrait(9429449),
  "Nomvula Khumalo": pexelsPortrait(11440539),
  "Nomsa Zondi": pexelsPortrait(4297233),
  "Palesa Ntuli": pexelsPortrait(4816338)
};

/* ---------- custom logos for salons (never human photos) ----------
   A deterministic abstract monogram badge + a matching banner, both
   inline SVG data URIs so salons always show a designed logo/display
   picture instead of a stock photo of a person. */
const LOGO_PALETTES = [
  { bg: "#5C1338", accent: "#D9A441" },
  { bg: "#164F42", accent: "#F0CB82" },
  { bg: "#8C1F4F", accent: "#1F6F5C" },
  { bg: "#2B1626", accent: "#D9A441" }
];
function salonInitials(name) {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
}
function salonLogoDataUri(name, index) {
  const { bg, accent } = LOGO_PALETTES[index % LOGO_PALETTES.length];
  const initials = salonInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="98" fill="${bg}"/>
    <circle cx="100" cy="100" r="98" fill="none" stroke="${accent}" stroke-width="4"/>
    <circle cx="100" cy="100" r="80" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/>
    <text x="100" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="600" fill="${accent}" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function salonBannerDataUri(name, index) {
  const { bg, accent } = LOGO_PALETTES[index % LOGO_PALETTES.length];
  const initials = salonInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="${bg}"/>
    <circle cx="560" cy="60" r="120" fill="${accent}" opacity="0.15"/>
    <circle cx="70" cy="380" r="90" fill="${accent}" opacity="0.12"/>
    <text x="320" y="240" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="600" fill="${accent}" text-anchor="middle" opacity="0.9">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeSlots(daysAhead, timesPerDay) {
  const slots = [];
  const today = new Date();
  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    timesPerDay.forEach((t) => {
      slots.push({ id: `${iso}-${t}`, date: iso, time: t, booked: false });
    });
  }
  return slots;
}

const MORNING = ["09:00", "10:30", "12:00"];
const AFTERNOON = ["13:30", "15:00", "16:30"];
const ALL_DAY = [...MORNING, ...AFTERNOON];

const PROVIDER_SEED = [
  // ---- House call: Makeup Artists ----
  { name: "Thandi Nkosi", type: "housecall", category: "Makeup Artist", city: "Johannesburg",
    bio: "Bridal & editorial makeup artist with 8 years on set and on the aisle.",
    services: [{ name: "Everyday Glam", price: 450, duration: 45 }, { name: "Bridal Makeup", price: 1200, duration: 90 }, { name: "Photoshoot Makeup", price: 800, duration: 60 }] },
  { name: "Refilwe Seetsi", type: "housecall", category: "Makeup Artist", city: "Bloemfontein",
    bio: "Soft-glam specialist, loves working with brides who want to look like themselves, only more.",
    services: [{ name: "Natural Glow Makeup", price: 400, duration: 45 }, { name: "Bridal Trial + Day", price: 1500, duration: 120 }] },
  { name: "Naledi Mahlangu", type: "housecall", category: "Makeup Artist", city: "eMalahleni",
    bio: "Matric dance and event makeup, known for long-wear finishes in summer heat.",
    services: [{ name: "Matric Dance Glam", price: 500, duration: 60 }, { name: "Event Makeup", price: 550, duration: 60 }] },

  // ---- House call: Barbers ----
  { name: "Sipho Dlamini", type: "housecall", category: "Barber", city: "Pretoria",
    bio: "Sharp fades and beard sculpting, straight to your door — no waiting room needed.",
    services: [{ name: "Skin Fade", price: 180, duration: 40 }, { name: "Beard Trim & Line-up", price: 100, duration: 20 }, { name: "Fade + Beard Combo", price: 250, duration: 55 }] },
  { name: "Mzansi Cuts (Bongani)", type: "housecall", category: "Barber", city: "Nelspruit",
    bio: "Old-school clippers, new-school fades. Kids and pensioners get a smile discount.",
    services: [{ name: "Classic Cut", price: 150, duration: 30 }, { name: "Fade & Design", price: 220, duration: 45 }] },
  { name: "Karabo Molefe", type: "housecall", category: "Barber", city: "Kimberley",
    bio: "Mobile barber for busy professionals — early mornings and evenings available.",
    services: [{ name: "Quick Trim", price: 130, duration: 25 }, { name: "Full Groom", price: 280, duration: 50 }] },

  // ---- House call: Nail Technicians ----
  { name: "Amahle Zulu", type: "housecall", category: "Nail Technician", city: "Durban",
    bio: "Gel, acrylic and nail art done on your kitchen table, no salon fumes required.",
    services: [{ name: "Gel Manicure", price: 250, duration: 45 }, { name: "Acrylic Full Set", price: 400, duration: 75 }, { name: "Nail Art Add-on", price: 100, duration: 20 }] },
  { name: "Precious Adjei", type: "housecall", category: "Nail Technician", city: "Gqeberha",
    bio: "Structured gel overlays that grow out neatly — big on nail health.",
    services: [{ name: "Structured Gel Overlay", price: 320, duration: 60 }, { name: "Pedicure", price: 220, duration: 45 }] },
  { name: "Zanele Buthelezi", type: "housecall", category: "Nail Technician", city: "Rustenburg",
    bio: "Bright, bold nail art inspired by Mzansi street style.",
    services: [{ name: "Gel Manicure", price: 240, duration: 45 }, { name: "Full Nail Art Set", price: 380, duration: 70 }] },

  // ---- House call: Braiders ----
  { name: "Lindiwe Mokoena", type: "housecall", category: "Braider", city: "Johannesburg",
    bio: "Box braids, cornrows and knotless — booked out most weekends, plan ahead.",
    services: [{ name: "Knotless Braids (Medium)", price: 700, duration: 240 }, { name: "Cornrows", price: 350, duration: 120 }, { name: "Kids Braids", price: 250, duration: 90 }] },
  { name: "Kagiso Ramaboa", type: "housecall", category: "Braider", city: "Polokwane",
    bio: "Feed-in braids and boho styles with beads, wool and extensions.",
    services: [{ name: "Feed-in Braids", price: 550, duration: 180 }, { name: "Boho Braids with Beads", price: 650, duration: 210 }] },
  { name: "Crown Braids (Ayanda)", type: "housecall", category: "Braider", city: "Cape Town",
    bio: "Protective styling specialist — gentle on edges, built to last 6+ weeks.",
    services: [{ name: "Knotless Braids (Large)", price: 600, duration: 200 }, { name: "Faux Locs", price: 900, duration: 300 }] },

  // ---- Salons ----
  { name: "The Mane Room", type: "salon", city: "Cape Town",
    bio: "A quiet, plant-filled salon in the city bowl focused on healthy colour work.",
    services: pickServices(["Haircut & Style", "Colour & Highlights", "Blow Dry", "Facial"]) },
  { name: "Glow & Co Salon", type: "salon", city: "Johannesburg",
    bio: "Sandton's go-to for quick lunchtime blow-dries and full glam evenings.",
    services: pickServices(["Blow Dry", "Makeup Application", "Facial", "Waxing"]) },
  { name: "Bella Hair Studio", type: "salon", city: "Pretoria",
    bio: "Family-run studio specialising in relaxer treatments and colour correction.",
    services: pickServices(["Relaxer Treatment", "Colour & Highlights", "Haircut & Style"]) },
  { name: "Nail Bar Durban", type: "salon", city: "Durban",
    bio: "Beachside nail bar — walk in barefoot, walk out fabulous.",
    services: pickServices(["Manicure", "Pedicure", "Gel Nails"]) },
  { name: "Urban Edge Barbershop", type: "salon", city: "East London",
    bio: "Classic barbershop chairs, hot towel shaves, sport on the big screen.",
    services: pickServices(["Haircut & Style", "Waxing"]) },
  { name: "Serenity Spa & Salon", type: "salon", city: "Kimberley",
    bio: "Full-day spa packages for when you need to properly switch off.",
    services: pickServices(["Full Body Massage", "Facial", "Pedicure", "Manicure"]) },
  { name: "Radiant Looks Salon", type: "salon", city: "Rustenburg",
    bio: "Bridal party favourite — books up fast over long weekends.",
    services: pickServices(["Bridal Package", "Makeup Application", "Haircut & Style", "Colour & Highlights"]) },
  { name: "Sharp Fade Barbers", type: "salon", city: "Johannesburg",
    bio: "Award-winning fades in the heart of the CBD.",
    services: pickServices(["Haircut & Style", "Waxing"]) },
  { name: "Tips & Toes Nail Studio", type: "salon", city: "Pretoria",
    bio: "Hygiene-first nail studio with autoclave-sterilised tools.",
    services: pickServices(["Manicure", "Pedicure", "Gel Nails"]) },
  { name: "Glamour House Salon", type: "salon", city: "Durban",
    bio: "One-stop shop: hair, nails, lashes and locs under one roof.",
    services: pickServices(["Locs Maintenance", "Braiding", "Manicure", "Colour & Highlights"]) }
];

function pickServices(names) {
  const priceMap = {
    "Haircut & Style": 220, "Colour & Highlights": 650, "Blow Dry": 180, "Relaxer Treatment": 380,
    "Facial": 350, "Manicure": 200, "Pedicure": 220, "Gel Nails": 320, "Full Body Massage": 550,
    "Waxing": 150, "Makeup Application": 450, "Braiding": 500, "Locs Maintenance": 400, "Bridal Package": 2200
  };
  const durMap = {
    "Haircut & Style": 45, "Colour & Highlights": 120, "Blow Dry": 30, "Relaxer Treatment": 90,
    "Facial": 60, "Manicure": 40, "Pedicure": 45, "Gel Nails": 60, "Full Body Massage": 75,
    "Waxing": 30, "Makeup Application": 60, "Braiding": 150, "Locs Maintenance": 90, "Bridal Package": 240
  };
  return names.map((n) => ({ name: n, price: priceMap[n], duration: durMap[n] }));
}

function buildUserFromSeed(seed, index) {
  const id = `p${index + 1}`;
  const withIds = (services) => services.map((s, i) => ({ id: `${id}-s${i}`, ...s }));
  const isSalon = seed.type === "salon";
  return {
    id,
    role: "provider",
    providerType: seed.type, // 'salon' | 'housecall'
    category: seed.category || null,
    name: seed.name,
    email: `${seed.name.toLowerCase().replace(/[^a-z]+/g, ".")}@salonhub.app`.replace(/\.+/g, "."),
    password: "password123",
    phone: `08${String(10000000 + index * 137).slice(0, 8)}`,
    city: seed.city,
    bio: seed.bio,
    image: isSalon ? salonLogoDataUri(seed.name, index) : (HOUSECALL_PORTRAITS[seed.name] || avatar(seed.name)),
    cover: isSalon ? salonBannerDataUri(seed.name, index) : coverImage(seed.name + index),
    services: withIds(seed.services),
    slots: makeSlots(14, seed.type === "salon" ? ALL_DAY : (index % 2 === 0 ? MORNING : AFTERNOON)),
    verified: index % 4 !== 0, // most verified, a few pending — good for the admin demo
    subscription: buildSeedSubscription(index),
    // seeded salons already have their certificate on file; seeded house-call
    // pros don't need one. Real salon signups attach a real file (see signup.js).
    registrationDocument: seed.type === "salon"
      ? { name: `${seed.name.replace(/\s+/g, "_")}_CIPC_certificate.pdf`, type: "application/pdf", dataUrl: null }
      : null,
    registrationStatus: seed.type === "salon" ? "submitted" : "not_required",
    createdAt: new Date().toISOString()
  };
}

function seedDatabase() {
  if (localStorage.getItem(DB_KEYS.seeded)) return;

  const providers = PROVIDER_SEED.map(buildUserFromSeed);

  const customers = [
    { id: "c1", role: "customer", name: "Demo Customer", email: "customer@demo.com", password: "demo1234",
      phone: "0821234567", city: "Johannesburg", image: avatar("demo-customer"), createdAt: new Date().toISOString() },
    { id: "c2", role: "customer", name: "Zanele Khumalo", email: "zanele@demo.com", password: "demo1234",
      phone: "0839876543", city: "Durban", image: avatar("zanele-k"), createdAt: new Date().toISOString() }
  ];

  const admin = { id: "admin1", role: "admin", name: "SalonHub Admin", email: "admin@salonhub.app",
    password: "admin123", image: avatar("admin-salonhub"), createdAt: new Date().toISOString() };

  const users = [...providers, ...customers, admin];
  localStorage.setItem(DB_KEYS.users, JSON.stringify(users));

  // A couple of demo bookings so dashboards aren't empty on first load
  const demoBookings = [
    { id: "b1", customerId: "c1", providerId: "p1", serviceId: "p1-s0", serviceName: "Everyday Glam",
      price: 450, date: providers[0].slots[0].date, time: providers[0].slots[0].time,
      providerName: providers[0].name, city: providers[0].city, status: "pending", createdAt: new Date().toISOString() },
    { id: "b2", customerId: "c2", providerId: "p13", serviceId: "p13-s0", serviceName: providers[12].services[0].name,
      price: providers[12].services[0].price, date: providers[12].slots[0].date, time: providers[12].slots[0].time,
      providerName: providers[12].name, city: providers[12].city, status: "confirmed", createdAt: new Date().toISOString() }
  ];
  // mark those slots booked
  providers[0].slots[0].booked = true;
  providers[12].slots[0].booked = true;
  localStorage.setItem(DB_KEYS.users, JSON.stringify(users));
  localStorage.setItem(DB_KEYS.bookings, JSON.stringify(demoBookings));
  localStorage.setItem(DB_KEYS.seeded, "true");
}

/* ---------- tiny "database" access layer ---------- */
const DB = {
  getUsers() { return JSON.parse(localStorage.getItem(DB_KEYS.users) || "[]"); },
  saveUsers(users) { localStorage.setItem(DB_KEYS.users, JSON.stringify(users)); },
  getBookings() { return JSON.parse(localStorage.getItem(DB_KEYS.bookings) || "[]"); },
  saveBookings(bookings) { localStorage.setItem(DB_KEYS.bookings, JSON.stringify(bookings)); },
  getSession() { return JSON.parse(localStorage.getItem(DB_KEYS.session) || "null"); },
  setSession(userId) { localStorage.setItem(DB_KEYS.session, JSON.stringify(userId)); },
  clearSession() { localStorage.removeItem(DB_KEYS.session); },
  currentUser() {
    const id = this.getSession();
    if (!id) return null;
    return this.getUsers().find((u) => u.id === id) || null;
  }
};

seedDatabase();
