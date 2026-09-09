const user = requireRole(["customer"]);
if (user) {
  renderNav();
  wireTabs();
  document.getElementById("welcome-line").textContent = `Welcome back, ${user.name.split(" ")[0]}.`;
  document.getElementById("logout-side").addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "index.html";
  });

  renderBookings();

  function renderBookings() {
    const bookings = DB.getBookings().filter((b) => b.customerId === user.id);
    const todayISO = new Date().toISOString().slice(0, 10);

    const upcoming = bookings.filter((b) => b.date >= todayISO && b.status !== "cancelled" && b.status !== "declined")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const history = bookings.filter((b) => !upcoming.includes(b))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    document.getElementById("upcoming-wrap").innerHTML = tableHTML(upcoming, true);
    document.getElementById("history-wrap").innerHTML = tableHTML(history, false);

    document.querySelectorAll(".cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => cancelBooking(btn.dataset.id));
    });
  }

  function tableHTML(bookings, allowCancel) {
    if (!bookings.length) {
      return `<div class="empty-state">No bookings here yet. <a href="browse.html" style="color:var(--wine); font-weight:600;">Find a provider</a> to get started.</div>`;
    }
    return `
      <table>
        <thead><tr><th>Provider</th><th>Service</th><th>Date &amp; time</th><th>Price</th><th>Status</th>${allowCancel ? "<th></th>" : ""}</tr></thead>
        <tbody>
          ${bookings.map((b) => `
            <tr>
              <td>${b.providerName}<br /><span class="small muted">${b.city}</span></td>
              <td>${b.serviceName}</td>
              <td>${formatDate(b.date)}, ${b.time}</td>
              <td>${formatMoney(b.price)}</td>
              <td><span class="badge badge-status-${b.status}">${b.status}</span></td>
              ${allowCancel ? `<td>${b.status === "pending" || b.status === "confirmed" ? `<button class="btn btn-sm btn-outline cancel-btn" data-id="${b.id}">Cancel</button>` : ""}</td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  function cancelBooking(bookingId) {
    if (!confirm("Cancel this booking?")) return;
    const bookings = DB.getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    booking.status = "cancelled";
    DB.saveBookings(bookings);

    // free up the provider's slot again
    const users = DB.getUsers();
    const provider = users.find((u) => u.id === booking.providerId);
    if (provider) {
      const slot = provider.slots.find((s) => s.date === booking.date && s.time === booking.time);
      if (slot) slot.booked = false;
      DB.saveUsers(users);
    }
    notifyCustomerOfBooking(user, provider, booking, "cancelled");
    renderBookings();
  }
}
