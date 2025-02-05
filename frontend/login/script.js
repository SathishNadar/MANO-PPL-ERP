async function loginUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (data.message === "Login successful") {
    // Set session with 30 days expiry
    setSession(data.user.username);

    // Redirect to DPR page
    window.location.href = `frontend\dpr\dpr.html`;
  } else {
    alert(data.message);
  }
}

function setSession(username) {
  const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionData = { username, expiry: expiryTime };
  localStorage.setItem("session", JSON.stringify(sessionData));
}

function getSession() {
  const sessionData = JSON.parse(localStorage.getItem("session"));
  if (!sessionData) return null;

  const { username, expiry } = sessionData;

  if (Date.now() > expiry) {
    // Session expired
    localStorage.removeItem("session");
    return null;
  }

  // Extend session expiration
  setSession(username);
  return username;
}


document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const email = document.getElementById("email").value;
  const phno = document.getElementById("phno").value;

  const response = await fetch("http://localhost:3000/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, confirmPassword, email, phno }),
  });

  const data = await response.json();

  if (response.ok) {
    alert(data.message);
  } else {
    alert(data.message);
  }
});
