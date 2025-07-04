import { ip_address } from "../ip.js";

async function loginUser(event) {
  event.preventDefault();
  const username = document.getElementById("login_username").value;
  const password = document.getElementById("login_password").value;

  const response = await fetch(`http://${ip_address}:3000/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_name: username,
      user_password: password,
    }),
  });

  if (!response.ok) {
    alert("Login failed. Please try again.");
    return;
  }

  const data = await response.json();
  if (data.message === "Login successful") {
    setSession(username, data.user_data.user_id);
    window.location.href = `../dahboard/homepage.html`;
  } else {
    alert(data.message);
  }
}

function setSession(username, userid) {
  const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const sessionData = { username, expiry: expiryTime, user_id: userid };
  localStorage.setItem("session", JSON.stringify(sessionData));
}

async function handleSignup(event) {
  event.preventDefault();

  const username = document.getElementById("Username").value.trim();
  const password = document.getElementById("signup_password").value;
  const email = document.getElementById("email").value;
  const phno = document.getElementById("phone_number").value;

  if (/\s/.test(password)) {
    alert("Password must not contain white spaces.");
    return;
  }

  try {
    const response = await fetch(`http://${ip_address}:3000/auth/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: username,
        user_password: password,
        email: email,
        phone_no: phno,
      }),
    });

    const data = await response.json();
    alert(data.message);
  } catch (error) {
    console.error("Signup failed:", error);
    alert("An error occurred. Please try again.");
  }
}

const form_slider = document.getElementById("form_slider");
const btn = document.getElementById("btn");
const header_cont = document.getElementById("header-cont");

btn.addEventListener("click", () => {
  form_slider.classList.toggle("move");

  if (form_slider.classList.contains("move")) {
    header_cont.textContent = "USER SIGN IN";
    btn.textContent = "ALREADY HAVE AN ACCOUNT?";
  } else {
    header_cont.textContent = "LOGIN HERE";
    btn.textContent = "DON'T HAVE AN ACCOUNT?";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-form").addEventListener("submit", loginUser);
  document
    .getElementById("signup-form")
    .addEventListener("submit", handleSignup);

  const eyeOpenSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const eyeSlashSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19.439 15.439C20.3636 14.5212 21.0775 13.6091 21.544 12.955C21.848 12.5287 22 12.3155 22 12C22 11.6845 21.848 11.4713 21.544 11.045C20.1779 9.12944 16.6892 5 12 5C11.0922 5 10.2294 5.15476 9.41827 5.41827M6.74742 6.74742C4.73118 8.1072 3.24215 9.94266 2.45604 11.045C2.15201 11.4713 2 11.6845 2 12C2 12.3155 2.15201 12.5287 2.45604 12.955C3.8221 14.8706 7.31078 19 12 19C13.9908 19 15.7651 18.2557 17.2526 17.2526"/>
      <path d="M9.85786 10C9.32783 10.53 9 11.2623 9 12.0711C9 13.6887 10.3113 15 11.9289 15C12.7377 15 13.47 14.6722 14 14.1421"/>
      <path d="M3 3L21 21"/>
    </svg>
  `;

  function setupToggle(buttonId, inputId) {
    const toggleBtn = document.getElementById(buttonId);
    const passwordInput = document.getElementById(inputId);
    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggleBtn.innerHTML = isHidden ? eyeSlashSVG : eyeOpenSVG;
    });
  }

  setupToggle("togglePassword", "login_password");
  setupToggle("toggleSignupPassword", "signup_password");
});
