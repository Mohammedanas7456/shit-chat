//const formatMessage = require("../../utils/message");

const socket = io();
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
//const deleteBtn = document.getElementById("deletBtn");

//const deleteBtn = document.getElementById("deleteBtn");

(async function loadAllMessages() {
  //load all messages
  const res = await fetch(`http://localhost:3321/getAllMessages?room=${room}`);
  const messages = await res.json();
  //const messages = json.data;
  console.log("messages", messages);

  messages.forEach((message) => loadMessage(message));
  chatMessages.scrollTop = chatMessages.scrollHeight;
})();

console.log(username, room);
// socket.on("message", (message) => {
//   console.log(message);
//   loadMessage(message);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// });
socket.on("new-message", (message) => {
  console.log(message);
});

socket.emit("join-room", { username, room });

socket.on("roomusers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on("userLeft", (username) => {
  removeUser(username);
});

// message sumbit

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = e.target.elements.msg.value;
  (async function loadNewMsg() {
    await fetch("http://localhost:3321/newMsg", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ message, username, room }),
    });
  })();

  //socket.emit("chat-message", message);
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

socket.on("newMsg", (msg) => {
  loadMessage(msg);
  console.log("your msg", msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("deleteMsg", (msgId) => {
  const toDlt = document.getElementById(msgId);
  toDlt.remove();
});

function loadMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.createdAt}</span></p><p class="text"> ${message.text} </p><div id="main"><button class="btn" >
  <i class="fas fa-paper-plane"></i>
  delete
</button><div class="btn" id="cant" style="display:block "> cant delete </div></div>
  `;
  div.setAttribute("id", message._id);
  document.querySelector(".chat-messages").appendChild(div);
  const divdlt = document.getElementById("cant");
  const anasdiv = document.getElementById("main");
  const deletBtn = div.querySelector(".btn");
  deletBtn.addEventListener("click", async () => {
    console.log("here:", message._id, message.text);
    const res = await fetch("http://localhost:3321/deleteMsg", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
      body: JSON.stringify({
        _id: message._id,
        room,
        username,
        msgUser: message.username,
      }),
    });
    if (res.status === 401) {
      console.log("hello", divdlt);
      console.log("main div", div);
      console.log("anas div", anasdiv);
      console.log("chat messages", chatMessages);

      divdlt.style.display = "none";

      setTimeout(() => {
        divdlt.style.display = "block";
      }, 2000);
    }
  });
}

function outputRoomName(room) {
  roomName.innerHTML = room;
}

function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.setAttribute("id", user.username);

    li.innerText = user.username;
    userList.appendChild(li);
  });
}
function removeUser(username) {
  console.log("username: ", username);
  const elem = document.getElementById(username);
  elem.remove();
  console.log("hello");
}
