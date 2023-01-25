const form = document.getElementById("signin-form");
let flag = true;

const API_BASE_URL = "http://" + window.location.host;
const cantSignIn = document.getElementById("cant-siginIn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = e.target.elements.username.value;

  const password = e.target.elements.password.value;
  const signedIn = document.getElementById("signedIn");
  const usernameIncorrect = document.getElementById("usernameIncorrect");

  let res = await fetch(`${API_BASE_URL}/signIn`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (res.ok) {
    res = await res.json();
    if (res.accessToken !== null) {
      //signedIn.style.display = "block";
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("username", e.target.elements.username.value);
      window.location.href = `/room.html?username=${username}`;
    } else {
      cantSignIn.style.display = "block";
    }
  } else {
    console.log("username is not crct");
    usernameIncorrect.style.display = "block";
  }
});

document.getElementById("back").addEventListener("click", (e) => {
  window.location.href = "/index.html";
});
