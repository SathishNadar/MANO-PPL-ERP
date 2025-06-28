import { ip_address } from "../ip.js";

async function loginUser(event) {
  event.preventDefault();
  console.log("isyuabd");
  const username = document.getElementById("login_username").value;
  const password = document.getElementById("login_password").value;

  const response = await fetch(`http://${ip_address}:3000/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_name: username,
      user_password: password,
    }),
  });

  if (!response.ok) {
    throw new Error("Network error: " + response.status);
  }

  const data = await response.json();
  const userid = data["user_data"]["user_id"];
  if (data.message === "Login successful") {
    setSession(username, userid);
    console.log(data);
    // Redirect to DPR page
    window.location.href = `../dahboard/homepage.html`;
    // console.log("Setting session:", sessionData);

  } else {
    alert(data.message);
  }
}


function setSession(username, userid) {
  const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const sessionData = { username, expiry: expiryTime, user_id:userid };
  localStorage.setItem("session", JSON.stringify(sessionData));
}



async function handleSignup(event) {
  event.preventDefault();

  const username = document.getElementById("Username").value;
  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value;
  const phno = document.getElementById("phone_number").value;

  try {
    const response = await fetch(`http://${ip_address}:3000/auth/signup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
  document.getElementById("signup-form").addEventListener("submit", handleSignup);
});
