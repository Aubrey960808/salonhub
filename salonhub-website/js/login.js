renderNav();
redirectIfLoggedIn();

if (qs("reset") === "1") document.getElementById("reset-success").style.display = "block";

const errorBox = document.getElementById("form-error");

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.classList.remove("is-visible");

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  const user = DB.getUsers().find((u) => u.email.toLowerCase() === email && u.password === password);
  if (!user) {
    errorBox.textContent = "That email and password don't match any account.";
    errorBox.classList.add("is-visible");
    return;
  }

  DB.setSession(user.id);
  const dashHref = user.role === "admin" ? "dashboard-admin.html"
    : user.role === "provider" ? "dashboard-provider.html"
    : "dashboard-customer.html";
  window.location.href = dashHref;
});
