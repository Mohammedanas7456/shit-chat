const div = document.getElementById("room");
const button = document.getElementById("button");
const privateBtn = document.getElementById("private-button");
const privateRoom = document.getElementById("private-room");
const createRoomBtn = document.getElementById("create-room");
const createRoom = document.getElementById("create-room-div");
const generatecode = document.getElementById("generate-code");
const createRoomForm = document.getElementById("create-room-form");
const created = document.getElementById("created");
const generatedCodeDiv = document.getElementById("generated-code-div");
const goToRoom = document.getElementById("go-to-room");
const codeForm = document.getElementById("enter-code-form");
const username = new URLSearchParams(window.location.search).get("username");
let flag = false;

if (username === null) {
  window.location.href = "/signin.html";
}
const publicRoom = document.getElementById("public-chat-form");

const API_BASE_URL = "http://" + window.location.host;

button.addEventListener("click", () => {
  privateRoom.style.display = "none";
  createRoom.style.display = "none";
  created.style.display = "none";
  generatedCodeDiv.style.display = "none";
  goToRoom.style.display = "none";
  flag = false;
  localStorage.setItem("flag", flag);

  if (div.style.display === "none") {
    div.style.display = "block";
  } else {
    div.style.display = "none";
  }
});
privateBtn.addEventListener("click", () => {
  div.style.display = "none";
  createRoom.style.display = "none";

  if (privateRoom.style.display === "none") {
    privateRoom.style.display = "block";
  } else {
    privateRoom.style.display = "none";
  }
});
createRoomBtn.addEventListener("click", () => {
  div.style.display = "none";
  privateRoom.style.display = "none";
  createRoom.style.display = "block";
});

createRoomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const roomName = e.target.elements.roomName.value;
  console.log("roomName: ", roomName);
  let res = await fetch(`${API_BASE_URL}/generateCode`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ roomName, username }),
  });
  if (res.ok) {
    res = await res.json();
    console.log("res", res);
    created.style.display = "block";
    generatedCodeDiv.innerText = `CODE : ${res}`;
    generatedCodeDiv.style.display = "block";
    goToRoom.style.display = "block";
    localStorage.setItem("roomName", roomName);
    const room_name = localStorage.getItem("roomName");
    console.log("room_name: ", room_name);
    localStorage.setItem("room-code", res);
    flag = true;
    localStorage.setItem("flag", flag);
    localStorage.setItem("admin", username);
  }
});

goToRoom.addEventListener("click", (e) => {
  const roomCode = localStorage.getItem("room-code");
  e.preventDefault();
  window.location.href = `/chat.html?room=${roomCode}&username=${username}&admin=${username}`;
});
codeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = e.target.elements.code.value;
  console.log("code: ", code);
  let res = await fetch(`${API_BASE_URL}/verifyCode`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (res.ok) {
    flag = true;
    res = await res.json();
    const admin = res.createdBy;
    localStorage.setItem("flag", flag);
    localStorage.setItem("room-code", code);
    window.location.href = `/chat.html?room=${code}&username=${username}&admin=${admin}`;

    console.log("code is valid");
  } else {
    const invalidCode = document.getElementById("invalidCode");
    invalidCode.style.display = "block";
    setTimeout(() => {
      invalidCode.style.display = "none";
    }, 2000);
    console.log("code isnt valid");
  }
});
publicRoom.addEventListener("submit", (e) => {
  e.preventDefault();
  const room = e.target.elements.room.value;
  //console.log("option: ", option);
  window.location.href = `/chat.html?room=${room}&username=${username}`;
});

document
  .getElementById("myRooms-button")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    window.location.href = `/myRooms.html?username=${username}`;
  });
document.getElementById("back").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/signin.html";
});
