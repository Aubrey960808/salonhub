const user = requireRole(["provider"]);
if (user) {
  renderNav();
  wireTabs();

  document.getElementById("logout-side").addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "index.html";
  });

  if (qs("welcome") === "1") document.getElementById("welcome-banner").style.display = "block";

  document.getElementById("dash-title").textContent = user.name;
  document.getElementById("view-listing-link").href = `provider.html?id=${user.id}`;
  refreshVerifyLine();

  document.getElementById("p-name").value = user.name;
  document.getElementById("p-city").value = user.city;
  document.getElementById("p-bio").value = user.bio || "";

  if (user.providerType === "salon") {
    document.getElementById("document-card").style.display = "block";
    renderDocumentStatus();
  }

  renderAll();

  function renderDocumentStatus() {
    const p = currentProvider();
    const doc = p.registrationDocument;
    const statusEl = document.getElementById("document-status");
    if (!doc) {
      statusEl.innerHTML = '<span class="badge badge-status-declined">Not submitted</span> Upload your CIPC registration certificate to be eligible for verification.';
    } else if (p.verified) {
      statusEl.innerHTML = `<span class="badge badge-verified">On file</span> ${doc.name}`;
    } else {
      statusEl.innerHTML = `<span class="badge badge-pending">Awaiting review</span> ${doc.name}`;
    }
  }

  const MAX_DOC_BYTES = 3 * 1024 * 1024;
  document.getElementById("document-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("document-error");
    const successBox = document.getElementById("document-success");
    errorBox.classList.remove("is-visible");
    successBox.style.display = "none";

    const file = document.getElementById("document-file").files[0];
    if (!file) { errorBox.textContent = "Choose a file first."; errorBox.classList.add("is-visible"); return; }
    if (file.size > MAX_DOC_BYTES) { errorBox.textContent = "That file is too large — please upload something under 3MB."; errorBox.classList.add("is-visible"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const users = DB.getUsers();
      const p = users.find((u) => u.id === user.id);
      p.registrationDocument = { name: file.name, type: file.type, dataUrl: reader.result };
      p.verified = false; // re-review required after a new document is submitted
      DB.saveUsers(users);
      successBox.style.display = "block";
      e.target.reset();
      renderDocumentStatus();
      refreshVerifyLine();
    };
    reader.onerror = () => { errorBox.textContent = "Couldn't read that file — try another one."; errorBox.classList.add("is-visible"); };
    reader.readAsDataURL(file);
  });

  function currentProvider() {
    return DB.getUsers().find((u) => u.id === user.id);
  }

  function refreshVerifyLine() {
    const p = currentProvider();
    if (p.verified) {
      document.getElementById("verify-line").innerHTML = '<span class="badge badge-verified">Verified</span> Your listing is public and bookable.';
      return;
    }
    const certNote = p.providerType === "salon"
      ? " We're checking your business registration certificate — see the Profile tab."
      : "";
    document.getElementById("verify-line").innerHTML = `<span class="badge badge-pending">Pending review</span> An admin needs to verify your account before you appear in search.${certNote}`;
  }

  function renderAll() {
    renderStats();
    renderBookings();
    renderServices();
    renderAvailability();
    refreshVerifyLine();
  }

  function renderStats() {
    const p = currentProvider();
    const bookings = DB.getBookings().filter((b) => b.providerId === p.id);
    const pending = bookings.filter((b) => b.status === "pending").length;
    const upcoming = bookings.filter((b) => b.status === "confirmed").length;
    const earned = bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.price, 0);
    document.getElementById("stat-grid").innerHTML = `
      <div class="stat-box"><div class="stat-num">${pending}</div><div class="stat-label">Pending requests</div></div>
      <div class="stat-box"><div class="stat-num">${upcoming}</div><div class="stat-label">Confirmed upcoming</div></div>
      <div class="stat-box"><div class="stat-num">${p.services.length}</div><div class="stat-label">Services listed</div></div>
      <div class="stat-box"><div class="stat-num">${formatMoney(earned)}</div><div class="stat-label">Earned (completed)</div></div>`;
  }

  function renderBookings() {
    const p = currentProvider();
    const bookings = DB.getBookings().filter((b) => b.providerId === p.id)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const wrap = document.getElementById("bookings-wrap");
    if (!bookings.length) {
      wrap.innerHTML = `<div class="empty-state">No bookings yet. Once your account is verified, clients will find you through search.</div>`;
      return;
    }
    const users = DB.getUsers();
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Client</th><th>Service</th><th>Date &amp; time</th><th>Price</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${bookings.map((b) => {
            const client = users.find((u) => u.id === b.customerId);
            return `
            <tr>
              <td>${client ? client.name : "Unknown"}</td>
              <td>${b.serviceName}</td>
              <td>${formatDate(b.date)}, ${b.time}</td>
              <td>${formatMoney(b.price)}</td>
              <td><span class="badge badge-status-${b.status}">${b.status}</span></td>
              <td>${bookingActionsHTML(b)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;

    wrap.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => updateBookingStatus(btn.dataset.id, btn.dataset.action));
    });
  }

  function bookingActionsHTML(b) {
    if (b.status === "pending") {
      return `<button class="btn btn-sm" data-action="confirmed" data-id="${b.id}">Accept</button>
        <button class="btn btn-sm btn-outline" data-action="declined" data-id="${b.id}">Decline</button>`;
    }
    if (b.status === "confirmed") {
      return `<button class="btn btn-sm btn-outline" data-action="completed" data-id="${b.id}">Mark complete</button>`;
    }
    return "";
  }

  function updateBookingStatus(bookingId, status) {
    const bookings = DB.getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    booking.status = status;
    DB.saveBookings(bookings);

    const users = DB.getUsers();
    if (status === "declined") {
      const p = users.find((u) => u.id === booking.providerId);
      const slot = p.slots.find((s) => s.date === booking.date && s.time === booking.time);
      if (slot) slot.booked = false;
      DB.saveUsers(users);
    }

    if (status === "confirmed" || status === "declined") {
      const customer = users.find((u) => u.id === booking.customerId);
      notifyCustomerOfBooking(customer, currentProvider(), booking, status);
    }
    renderAll();
  }

  function renderServices() {
    const p = currentProvider();
    const wrap = document.getElementById("services-wrap");
    if (!p.services.length) {
      wrap.innerHTML = `<div class="empty-state">No services listed yet — add your first one below.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Service</th><th>Price</th><th>Duration</th><th></th></tr></thead>
        <tbody>
          ${p.services.map((s) => `
            <tr>
              <td>${s.name}</td>
              <td>${formatMoney(s.price)}</td>
              <td>${s.duration} min</td>
              <td><button class="btn btn-sm btn-outline" data-remove-service="${s.id}">Remove</button></td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    wrap.querySelectorAll("[data-remove-service]").forEach((btn) => {
      btn.addEventListener("click", () => removeService(btn.dataset.removeService));
    });
  }

  document.getElementById("service-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("s-name").value.trim();
    const price = Number(document.getElementById("s-price").value);
    const duration = Number(document.getElementById("s-duration").value);
    if (!name || !price || !duration) return;

    const users = DB.getUsers();
    const p = users.find((u) => u.id === user.id);
    p.services.push({ id: `${p.id}-s${Date.now()}`, name, price, duration });
    DB.saveUsers(users);
    e.target.reset();
    renderAll();
  });

  function removeService(serviceId) {
    if (!confirm("Remove this service?")) return;
    const users = DB.getUsers();
    const p = users.find((u) => u.id === user.id);
    p.services = p.services.filter((s) => s.id !== serviceId);
    DB.saveUsers(users);
    renderAll();
  }

  function renderAvailability() {
    const p = currentProvider();
    const wrap = document.getElementById("availability-wrap");
    const future = (p.slots || []).filter((s) => s.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (!future.length) {
      wrap.innerHTML = `<p class="muted small">No upcoming slots — add one below.</p>`;
    } else {
      wrap.innerHTML = future.map((s) => `
        <span class="chip">
          ${formatDate(s.date)}, ${s.time} ${s.booked ? "· booked" : ""}
          ${!s.booked ? `<button data-remove-slot="${s.id}" title="Remove slot">&times;</button>` : ""}
        </span>`).join("");
      wrap.querySelectorAll("[data-remove-slot]").forEach((btn) => {
        btn.addEventListener("click", () => removeSlot(btn.dataset.removeSlot));
      });
    }
  }

  document.getElementById("slot-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("slot-date").value;
    const time = document.getElementById("slot-time").value;
    if (!date || !time) return;

    const users = DB.getUsers();
    const p = users.find((u) => u.id === user.id);
    const id = `${date}-${time}`;
    if (p.slots.some((s) => s.id === id)) { alert("You already have that slot."); return; }
    p.slots.push({ id, date, time, booked: false });
    DB.saveUsers(users);
    e.target.reset();
    renderAll();
  });

  function removeSlot(slotId) {
    const users = DB.getUsers();
    const p = users.find((u) => u.id === user.id);
    p.slots = p.slots.filter((s) => s.id !== slotId);
    DB.saveUsers(users);
    renderAll();
  }

  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const users = DB.getUsers();
    const p = users.find((u) => u.id === user.id);
    p.name = document.getElementById("p-name").value.trim() || p.name;
    p.city = document.getElementById("p-city").value.trim() || p.city;
    p.bio = document.getElementById("p-bio").value.trim();
    DB.saveUsers(users);
    document.getElementById("profile-success").style.display = "block";
    document.getElementById("dash-title").textContent = p.name;
    setTimeout(() => { document.getElementById("profile-success").style.display = "none"; }, 2500);
  });
}
