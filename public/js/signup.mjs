const form = document.getElementById("signup-form");
const usernameTaken = document.getElementById("username-taken");
const API_BASE_URL = "http://" + window.location.host;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = e.target.elements.username.value;
  console.log(username);

  const password = e.target.elements.password.value;
  console.log("password: ", password);
  const ConfirmPassword = e.target.elements.ConfirmPassword.value;
  console.log("confirmPassword: ", ConfirmPassword);

  let res = await fetch(`${API_BASE_URL}/checkUsername`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ username }),
  });
  console.log("res", res);
  if (res.status === 200) {
    console.log("can create username");
    if (password === ConfirmPassword) {
      console.log("hello");
      const userCreated = document.getElementById("user-created");
      userCreated.style.display = "block";
      e.preventDefault();
      const signIn = document.getElementById("sign-in");
      signIn.style.display = "block";
      (async function loadNewMsg() {
        await fetch(`${API_BASE_URL}/userCreated`, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
      })();
    } else {
      e.preventDefault();
      document.getElementById("cant-create").style.display = "block";
      setTimeout(() => {
        document.getElementById("cant-create").style.display = "none";
      }, 2000);
    }
  } else {
    console.log("cant create user name");
    usernameTaken.style.display = "block";
    setTimeout(() => {
      usernameTaken.style.display = "none";
    }, 2000);
  }
});

document.getElementById("signup-btn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("signup-form").style.display = "block";
  document.getElementById("btn-container").style.display = "none";
  document.getElementById("back").style.display = "block";
});
document.getElementById("signin-btn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/signin.html";
});
document.getElementById("back").addEventListener("click", (e) => {
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("btn-container").style.display = "flex";
  document.getElementById("back").style.display = "none";
});
