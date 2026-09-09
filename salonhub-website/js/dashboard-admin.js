const user = requireRole(["admin"]);
if (user) {
  renderNav();
  wireTabs();

  document.getElementById("logout-side").addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "index.html";
  });

  document.getElementById("provider-filter").addEventListener("change", renderProviders);

  renderAll();

  function renderAll() {
    renderStats();
    renderProviders();
    renderCustomers();
    renderSubscriptions();
    renderBookings();
  }

  function renderStats() {
    const users = DB.getUsers();
    const providers = users.filter((u) => u.role === "provider");
    const customers = users.filter((u) => u.role === "customer");
    const bookings = DB.getBookings();
    const pendingSalonDocs = providers.filter((p) => p.providerType === "salon" && !p.verified).length;
    const activeSubs = providers.filter((p) => p.subscription && p.subscription.status === "active");
    const mrr = activeSubs.reduce((sum, p) => {
      const plan = planById(p.subscription.planId);
      return sum + (plan ? plan.price : 0);
    }, 0);
    document.getElementById("stat-grid").innerHTML = `
      <div class="stat-box"><div class="stat-num">${providers.length}</div><div class="stat-label">Total providers</div></div>
      <div class="stat-box"><div class="stat-num">${providers.filter((p) => !p.verified).length}</div><div class="stat-label">Pending verification</div></div>
      <div class="stat-box"><div class="stat-num">${pendingSalonDocs}</div><div class="stat-label">Salon certificates to review</div></div>
      <div class="stat-box"><div class="stat-num">${activeSubs.length}</div><div class="stat-label">Active subscriptions</div></div>
      <div class="stat-box"><div class="stat-num">${formatMoney(mrr)}</div><div class="stat-label">Monthly recurring revenue</div></div>
      <div class="stat-box"><div class="stat-num">${customers.length}</div><div class="stat-label">Customers</div></div>
      <div class="stat-box"><div class="stat-num">${bookings.length}</div><div class="stat-label">Total bookings</div></div>`;
  }

  function renderProviders() {
    const filter = document.getElementById("provider-filter").value;
    let providers = DB.getUsers().filter((u) => u.role === "provider");
    if (filter === "pending") providers = providers.filter((p) => !p.verified);
    if (filter === "verified") providers = providers.filter((p) => p.verified);
    providers.sort((a, b) => a.name.localeCompare(b.name));

    const wrap = document.getElementById("providers-wrap");
    if (!providers.length) {
      wrap.innerHTML = `<div class="empty-state">Nothing to show here.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Services</th><th>Certificate</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${providers.map((p) => `
            <tr>
              <td><a href="provider.html?id=${p.id}" target="_blank" style="color:var(--wine-dark); font-weight:600;">${p.name}</a><br /><span class="small muted">${p.email}</span></td>
              <td>${p.providerType === "housecall" ? p.category : "Salon"}</td>
              <td>${p.city}</td>
              <td>${p.services.length}</td>
              <td>${certificateCellHTML(p)}</td>
              <td>${p.verified ? '<span class="badge badge-verified">Verified</span>' : '<span class="badge badge-pending">Pending</span>'}</td>
              <td>
                <button class="btn btn-sm ${p.verified ? "btn-outline" : ""}" data-toggle-verify="${p.id}">${p.verified ? "Unverify" : "Verify"}</button>
                <button class="btn btn-sm btn-danger" data-remove-user="${p.id}">Remove</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;

    wrap.querySelectorAll("[data-toggle-verify]").forEach((btn) => {
      btn.addEventListener("click", () => toggleVerify(btn.dataset.toggleVerify));
    });
    wrap.querySelectorAll("[data-remove-user]").forEach((btn) => {
      btn.addEventListener("click", () => removeUser(btn.dataset.removeUser));
    });
  }

  function certificateCellHTML(p) {
    if (p.providerType !== "salon") return '<span class="small muted">Not required</span>';
    const doc = p.registrationDocument;
    if (!doc) return '<span class="badge badge-status-declined">Not submitted</span>';
    if (doc.dataUrl) {
      return `<a href="${doc.dataUrl}" target="_blank" style="color:var(--wine); font-weight:600;">View certificate</a>`;
    }
    return `<span class="small muted">${doc.name} (seed data, no file)</span>`;
  }

  function toggleVerify(providerId) {
    const users = DB.getUsers();
    const p = users.find((u) => u.id === providerId);
    p.verified = !p.verified;
    DB.saveUsers(users);
    renderAll();
  }

  function renderCustomers() {
    const customers = DB.getUsers().filter((u) => u.role === "customer").sort((a, b) => a.name.localeCompare(b.name));
    const wrap = document.getElementById("customers-wrap");
    if (!customers.length) {
      wrap.innerHTML = `<div class="empty-state">No customers yet.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Bookings made</th><th></th></tr></thead>
        <tbody>
          ${customers.map((c) => `
            <tr>
              <td>${c.name}</td>
              <td>${c.email}</td>
              <td>${c.city}</td>
              <td>${DB.getBookings().filter((b) => b.customerId === c.id).length}</td>
              <td><button class="btn btn-sm btn-danger" data-remove-user="${c.id}">Remove</button></td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    wrap.querySelectorAll("[data-remove-user]").forEach((btn) => {
      btn.addEventListener("click", () => removeUser(btn.dataset.removeUser));
    });
  }

  function removeUser(userId) {
    if (!confirm("Remove this account? This can't be undone.")) return;
    let users = DB.getUsers();
    users = users.filter((u) => u.id !== userId);
    DB.saveUsers(users);
    renderAll();
  }

  function renderSubscriptions() {
    const providers = DB.getUsers().filter((u) => u.role === "provider")
      .sort((a, b) => a.name.localeCompare(b.name));
    const wrap = document.getElementById("subscriptions-wrap");
    if (!providers.length) {
      wrap.innerHTML = `<div class="empty-state">No providers yet.</div>`;
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Provider</th><th>Plan</th><th>Status</th><th>Renews</th><th></th></tr></thead>
        <tbody>
          ${providers.map((p) => {
            const sub = p.subscription || { status: "inactive" };
            const plan = planById(sub.planId);
            const isActive = sub.status === "active";
            return `
            <tr>
              <td><a href="provider.html?id=${p.id}" target="_blank" style="color:var(--wine-dark); font-weight:600;">${p.name}</a></td>
              <td>${plan ? plan.name : "—"}${plan ? ` (${formatMoney(plan.price)}/mo)` : ""}</td>
              <td><span class="badge ${isActive ? "badge-status-confirmed" : "badge-status-declined"}">${sub.status}</span></td>
              <td>${sub.renewsAt ? formatDate(sub.renewsAt.slice(0, 10)) : "—"}</td>
              <td>
                ${plan ? `<button class="btn btn-sm ${isActive ? "btn-outline" : ""}" data-toggle-sub="${p.id}">${isActive ? "Deactivate" : "Reactivate"}</button>` : '<span class="small muted">No plan chosen</span>'}
              </td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;

    wrap.querySelectorAll("[data-toggle-sub]").forEach((btn) => {
      btn.addEventListener("click", () => toggleSubscription(btn.dataset.toggleSub));
    });
  }

  function toggleSubscription(providerId) {
    const users = DB.getUsers();
    const p = users.find((u) => u.id === providerId);
    if (!p.subscription) return;
    p.subscription.status = p.subscription.status === "active" ? "inactive" : "active";
    DB.saveUsers(users);
    renderAll();
  }

  function renderBookings() {
    const bookings = DB.getBookings().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const wrap = document.getElementById("bookings-wrap");
    if (!bookings.length) {
      wrap.innerHTML = `<div class="empty-state">No bookings on the platform yet.</div>`;
      return;
    }
    const users = DB.getUsers();
    wrap.innerHTML = `
      <table>
        <thead><tr><th>Customer</th><th>Provider</th><th>Service</th><th>Date &amp; time</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>
          ${bookings.map((b) => {
            const customer = users.find((u) => u.id === b.customerId);
            return `
            <tr>
              <td>${customer ? customer.name : "Removed customer"}</td>
              <td>${b.providerName}</td>
              <td>${b.serviceName}</td>
              <td>${formatDate(b.date)}, ${b.time}</td>
              <td>${formatMoney(b.price)}</td>
              <td><span class="badge badge-status-${b.status}">${b.status}</span></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  }
}
