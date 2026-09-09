const user = requireRole(["customer", "provider"]);
if (user) {
  renderNav();

  render();

  function render() {
    const items = NOTIFY.forUser(user.id);
    const list = document.getElementById("notif-list");
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">No notifications yet. You'll see booking confirmations here.</div>`;
      return;
    }
    list.innerHTML = items.map((n) => `
      <div class="notif-item ${n.read ? "" : "is-unread"}" data-id="${n.id}">
        <div class="notif-channel">${n.channel === "sms" ? "SMS" : "MAIL"}</div>
        <div style="flex:1;">
          <div class="notif-subject">${n.subject}</div>
          <div class="notif-body">${n.body}</div>
          <div class="notif-meta">To ${n.to} &middot; ${new Date(n.createdAt).toLocaleString("en-ZA")}</div>
        </div>
      </div>`).join("");

    list.querySelectorAll(".notif-item").forEach((el) => {
      el.addEventListener("click", () => {
        NOTIFY.markRead(el.dataset.id);
        renderNav();
        render();
      });
    });
  }

  document.getElementById("mark-all-read").addEventListener("click", () => {
    NOTIFY.markAllRead(user.id);
    renderNav();
    render();
  });
}
