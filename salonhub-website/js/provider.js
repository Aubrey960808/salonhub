renderNav();

const providerId = qs("id");
const provider = DB.getUsers().find((u) => u.id === providerId && u.role === "provider");

if (!provider) {
  document.getElementById("not-found").style.display = "block";
} else {
  document.getElementById("provider-page").style.display = "block";
  document.title = `${provider.name} — SalonHub`;

  document.getElementById("p-cover").src = provider.cover;
  document.getElementById("p-cover").alt = provider.name;
  document.getElementById("p-name").textContent = provider.name;
  document.getElementById("p-bio").textContent = provider.bio;
  document.getElementById("p-location").textContent =
    provider.providerType === "housecall" ? `Travels to you in ${provider.city}` : `Visit them in ${provider.city}`;

  const typeLabel = provider.providerType === "housecall" ? provider.category : "Salon";
  const badgeClass = provider.providerType === "housecall" ? "badge-housecall" : "badge-salon";
  document.getElementById("p-badges").innerHTML = `
    <span class="badge ${badgeClass}">${typeLabel}</span>
    ${provider.verified ? '<span class="badge badge-verified">Verified</span>' : '<span class="badge badge-pending">Pending review</span>'}`;

  let selectedServiceId = null;
  let selectedSlotId = null;

  renderServices();
  renderSlots();
  updateSummary();

  function renderServices() {
    const el = document.getElementById("services-list");
    if (!provider.services.length) {
      el.innerHTML = `<p class="muted small">This provider hasn't listed any services yet.</p>`;
      return;
    }
    el.innerHTML = provider.services.map((s) => `
      <div class="service-row">
        <label>
          <input type="radio" name="service" value="${s.id}" ${selectedServiceId === s.id ? "checked" : ""} />
          <div>
            <div class="service-name">${s.name}</div>
            <div class="service-meta">${s.duration} min</div>
          </div>
        </label>
        <div>${formatMoney(s.price)}</div>
      </div>`).join("");

    el.querySelectorAll('input[name="service"]').forEach((input) => {
      input.addEventListener("change", () => {
        selectedServiceId = input.value;
        updateSummary();
      });
    });
  }

  function renderSlots() {
    const el = document.getElementById("slots-list");
    const openSlots = (provider.slots || []).filter((s) => !s.booked);
    if (!openSlots.length) {
      el.innerHTML = `<p class="muted small">No open time slots right now — check back soon.</p>`;
      return;
    }
    const byDay = {};
    openSlots.forEach((s) => { (byDay[s.date] = byDay[s.date] || []).push(s); });

    el.innerHTML = Object.keys(byDay).sort().slice(0, 7).map((date) => `
      <div class="day-group">
        <div class="day-label">${formatDate(date)}</div>
        <div class="slot-grid">
          ${byDay[date].map((s) => `
            <button type="button" class="slot-btn ${selectedSlotId === s.id ? "is-selected" : ""}" data-slot="${s.id}">${s.time}</button>
          `).join("")}
        </div>
      </div>`).join("");

    el.querySelectorAll(".slot-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSlotId = btn.dataset.slot;
        renderSlots();
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const summary = document.getElementById("booking-summary");
    const btn = document.getElementById("confirm-booking-btn");
    const service = provider.services.find((s) => s.id === selectedServiceId);
    const slot = (provider.slots || []).find((s) => s.id === selectedSlotId);

    if (!service && !slot) {
      summary.innerHTML = "Select a service and a time slot to continue.";
      btn.disabled = true;
      return;
    }
    summary.innerHTML = `
      <div><strong>${service ? service.name : "Choose a service"}</strong></div>
      <div>${slot ? `${formatDate(slot.date)} at ${slot.time}` : "Choose a time slot"}</div>
      ${service ? `<div style="margin-top:8px;">${formatMoney(service.price)}</div>` : ""}`;
    btn.disabled = !(service && slot);
  }

  document.getElementById("confirm-booking-btn").addEventListener("click", () => {
    const errorBox = document.getElementById("booking-error");
    const successBox = document.getElementById("booking-success");
    errorBox.classList.remove("is-visible");

    const user = DB.currentUser();
    if (!user) {
      window.location.href = `login.html?next=provider.html?id=${provider.id}`;
      return;
    }
    if (user.role !== "customer") {
      errorBox.textContent = "Only customer accounts can book appointments.";
      errorBox.classList.add("is-visible");
      return;
    }

    const service = provider.services.find((s) => s.id === selectedServiceId);
    const slot = provider.slots.find((s) => s.id === selectedSlotId);
    if (!service || !slot || slot.booked) {
      errorBox.textContent = "That slot was just taken — please pick another.";
      errorBox.classList.add("is-visible");
      renderSlots();
      return;
    }

    const users = DB.getUsers();
    const providerRecord = users.find((u) => u.id === provider.id);
    const slotRecord = providerRecord.slots.find((s) => s.id === slot.id);
    slotRecord.booked = true;
    DB.saveUsers(users);

    const bookings = DB.getBookings();
    bookings.push({
      id: "b" + Date.now(),
      customerId: user.id,
      providerId: provider.id,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      date: slot.date,
      time: slot.time,
      providerName: provider.name,
      city: provider.city,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    DB.saveBookings(bookings);
    notifyCustomerOfBooking(user, provider, bookings[bookings.length - 1], "requested");

    successBox.style.display = "block";
    successBox.textContent = "Booking requested! We've sent a confirmation to your email and phone. Redirecting to your dashboard...";
    document.getElementById("confirm-booking-btn").disabled = true;
    setTimeout(() => { window.location.href = "dashboard-customer.html"; }, 1200);
  });
}
