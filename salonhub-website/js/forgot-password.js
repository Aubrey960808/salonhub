renderNav();
redirectIfLoggedIn();

const RESET_KEY = "salonhub_resets";
function getResets() { return JSON.parse(localStorage.getItem(RESET_KEY) || "[]"); }
function saveResets(list) { localStorage.setItem(RESET_KEY, JSON.stringify(list)); }

const errorBox = document.getElementById("form-error");

document.getElementById("forgot-form").addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.classList.remove("is-visible");

  const email = document.getElementById("email").value.trim().toLowerCase();
  const user = DB.getUsers().find((u) => u.email.toLowerCase() === email);
  if (!user) {
    errorBox.textContent = "We couldn't find an account with that email.";
    errorBox.classList.add("is-visible");
    return;
  }

  const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const resets = getResets().filter((r) => r.email !== user.email);
  resets.push({ email: user.email, token, expires: Date.now() + 30 * 60 * 1000 });
  saveResets(resets);

  const resetLink = `${window.location.origin}${window.location.pathname.replace("forgot-password.html", "")}reset-password.html?token=${token}&email=${encodeURIComponent(user.email)}`;
  const subject = "Reset your SalonHub password";
  const body = `Hi ${user.name.split(" ")[0]}, use this link within 30 minutes to reset your password: ${resetLink}`;

  NOTIFY.send({ userId: user.id, channel: "email", to: user.email, subject, body });
  if (user.phone) NOTIFY.send({ userId: user.id, channel: "sms", to: user.phone, subject, body });

  document.getElementById("forgot-form").style.display = "none";
  document.getElementById("sent-panel").style.display = "block";
  document.getElementById("demo-message").innerHTML = `
    <strong>${subject}</strong><br />
    Hi ${user.name.split(" ")[0]}, use this link within 30 minutes to reset your password:<br />
    <a href="${resetLink}" style="color:var(--wine); word-break:break-all;">${resetLink}</a>`;
});
