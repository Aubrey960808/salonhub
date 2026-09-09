/* ============================================================
   SalonHub — simulated email & SMS notifications
   There's no backend on a GitHub Pages site, so this logs
   "sent" emails/SMS into localStorage instead of actually
   dispatching them, and shows them in notifications.html so the
   confirmation flow can be demoed end-to-end. Swap NOTIFY.send()
   for a real call (e.g. a serverless function using SendGrid /
   Twilio) to make this send for real — every call site already
   goes through this one function.
   ============================================================ */

const NOTIFY_KEY = "salonhub_notifications";

const NOTIFY = {
  getAll() { return JSON.parse(localStorage.getItem(NOTIFY_KEY) || "[]"); },
  saveAll(list) { localStorage.setItem(NOTIFY_KEY, JSON.stringify(list)); },

  send({ userId, channel, to, subject, body }) {
    const list = this.getAll();
    list.push({
      id: "n" + Date.now() + Math.random().toString(16).slice(2, 6),
      userId, channel, to, subject, body,
      read: false,
      createdAt: new Date().toISOString()
    });
    this.saveAll(list);
  },

  forUser(userId) {
    return this.getAll().filter((n) => n.userId === userId)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  },

  unreadCount(userId) {
    return this.getAll().filter((n) => n.userId === userId && !n.read).length;
  },

  markRead(id) {
    const list = this.getAll();
    const n = list.find((x) => x.id === id);
    if (n) n.read = true;
    this.saveAll(list);
  },

  markAllRead(userId) {
    const list = this.getAll();
    list.forEach((n) => { if (n.userId === userId) n.read = true; });
    this.saveAll(list);
  }
};

/* Sends both an email and an SMS confirmation to a customer about a
   booking's current state (requested / confirmed / declined / cancelled). */
function notifyCustomerOfBooking(customer, provider, booking, event) {
  if (!customer) return;
  const details = `${booking.serviceName} with ${provider ? provider.name : booking.providerName} on ${formatDate(booking.date)} at ${booking.time}, ${booking.city}. Total: ${formatMoney(booking.price)}.`;

  const copy = {
    requested: {
      subject: "We've received your booking request",
      body: `Hi ${customer.name.split(" ")[0]}, your request is in: ${details} You'll get another message as soon as it's confirmed.`
    },
    confirmed: {
      subject: "Your appointment is confirmed",
      body: `Hi ${customer.name.split(" ")[0]}, you're confirmed: ${details} See you then!`
    },
    declined: {
      subject: "Your booking request couldn't be confirmed",
      body: `Hi ${customer.name.split(" ")[0]}, unfortunately ${provider ? provider.name : booking.providerName} couldn't confirm this slot: ${details} Please pick another time.`
    },
    cancelled: {
      subject: "Booking cancelled",
      body: `Hi ${customer.name.split(" ")[0]}, this booking has been cancelled: ${details}`
    }
  }[event];
  if (!copy) return;

  NOTIFY.send({ userId: customer.id, channel: "email", to: customer.email, subject: copy.subject, body: copy.body });
  NOTIFY.send({ userId: customer.id, channel: "sms", to: customer.phone, subject: copy.subject, body: copy.body });
}
