        //------------------------------------------FORM SLIDER FUNCTIONALITY-------------------------------------//
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
        
        //------------------------------------------FORM VALIDATION-------------------------------------//
        // Signup Form Validation
        
        //----global variables---//

        document.querySelector(".signup-form form").addEventListener("submit", function (event) {
            event.preventDefault();
            
        let signupUsername = document.getElementById("username").value;
        let signupEmail = document.getElementById("email").value;
        let signupPassword = document.getElementById("password").value;
        let signupConfirmPassword = document.getElementById("confirm-password").value;
        let phoneNumber = document.getElementById("phone_number").value;
        let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!signupUsername) {
                alert("Username is required!");
                return;
            }
            
            if (!emailPattern.test(signupEmail)) {
                alert("Enter a valid email!");
                return;
            }

            if (signupPassword.length < 6) {
                alert("Password must be at least 6 characters long!");
                return;
            }
            
            if (signupPassword !== signupConfirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            
            alert("Sign Up Successful!");
            signup_post(signupUsername,signupPassword,signupEmail,phoneNumber);
        });
        
        
        
        
//------------------------------------TO STORE THE USER DATA IN BACKEND------------------------//

function signup_post(signupUsername, signupPassword, signupEmail, phoneNumber) {
    // Create the request payload
    const signupData = {
        user_name: signupUsername,
        user_password: signupPassword,
        email: signupEmail,
        phone_no: phoneNumber
    };

    // Configure the fetch request
    return fetch('http://35.154.101.129:3000/auth/signup/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
    })
    .then(response => {
        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON response
        return response.json();
    })
    .then(data => {
        // Return the parsed JSON data
        return data;
    })
    .catch(error => {
        // Handle errors (e.g., network issues, invalid JSON, etc.)
        console.error('Error during signup:', error);
        throw error; // Re-throw the error if you want to handle it elsewhere
    });
}


//--------------------------------TO RETRIVE THE DATA FROM THE BACKEND--------------------------------------//

document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent page refresh

    let loginUsername = document.getElementById("login_username").value;
    let loginPassword = document.getElementById("login_password").value;

    login_get(loginUsername, loginPassword);
});
function login_get(loginUsername, loginPassword) {
    let login = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "user_name": loginUsername,
            "user_password":loginPassword
        })
    };

    fetch('http://35.154.101.129:3000/auth/login/', login)
        .then(res => res.json()) // Convert response to JSON
        .then(data => {
            console.log(data); // Debugging purpose

            if (data.message === "Login successful") { 
                redirection()
                // localStorage.setItem("token", data.token); // Store token if needed
                // window.location.href = "dashboard.html"; // Redirect to dashboard
            } else {
                alert("Invalid username or password!");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Login Failed! Please try again.");
        });
}



function redirection(){
    // window.open("play_on.html",'_blank');
    window.location.href="../dahboard/homepage.html";
}





