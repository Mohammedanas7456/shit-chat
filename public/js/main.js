const token = localStorage.getItem("accessToken");
//console.log("token", token);

const socket = io();
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const room = new URLSearchParams(window.location.search).get("room");
const admin = new URLSearchParams(window.location.search).get("admin");
const username = new URLSearchParams(window.location.search).get("username");
const roomCodeDiv = document.getElementById("room-code-div");
roomParentDiv = document.getElementById("room-parent-div");
const copyBtn = document.getElementById("copyBtn");
// console.log("username: ", username);
// console.log("room: ", room);
let CALL_TYPE;
// div//

const roomName = document.getElementById("room-name");

const room_name = localStorage.getItem("roomName");
const flag = JSON.parse(localStorage.getItem("flag"));

//console.log("flag: ", flag);
// const roomCode = localStorage.getItem("room-code");
// console.log("roomCode: ", roomCode);
//console.log("room_name: ", room_name);
const userList = document.getElementById("users");

const API_BASE_URL = "http://" + window.location.host;

(async function loadAllMessages() {
  //load all messages
  const res = await fetch(`${API_BASE_URL}/getAllMessages?room=${room}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const messages = await res.json();
  //const messages = json.data;
  //console.log("messages", messages);

  messages.forEach((message) => loadMessage(message));
  chatMessages.scrollTop = chatMessages.scrollHeight;
})();

// console.log(username, room);

socket.on("message", (message) => {
  loadMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  //console.log(message);
});

socket.emit("join-room", { username, room });
//console.log("hello private room");

socket.on("roomusers", ({ room, users }) => {
  outputRoomName(room, room_name);
  outputUsers(users);
});

socket.on("deleteRoom", (room) => {
  setTimeout(() => {
    window.location.href = `/room.html?username=${username}`;
  }, 2000);
});

socket.on("incoming-call", ({ room, callType, username }) => {
  setTimeout(async () => {
    endCall();
    const res = await fetch(`${API_BASE_URL}/notAnswering`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        room,
      }),
    });
  }, 10000);
  console.log("username: ", username);
  CALL_TYPE = callType;

  const audioElem = document.getElementById("call-ringing");
  audioElem.setAttribute("src", "./assets/audio/call.wav");
  audioElem.play();
  document.getElementById("call").style.display = "none";
  document.getElementById(
    "caller-name"
  ).innerHTML = `incoming call from ${username}`;
  document.getElementById("incoming-call").style.display = "flex";
});

socket.on("userLeft", (username) => {
  removeUser(username);
});

// message sumbit

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = e.target.elements.msg.value;
  (async function loadNewMsg() {
    await fetch(`${API_BASE_URL}/newMsg`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ message, username, room, flag }),
    });
  })();

  //socket.emit("chat-message", message);
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

socket.on("newMsg", (msg) => {
  console.log(msg.username);
  if (msg.username !== username) {
    const audioElem = document.getElementById("msg-tone");
    audioElem.setAttribute("src", "./assets/audio/Snapchat-Tone.mp3");
    audioElem.play();
  }
  loadMessage(msg);
  //console.log("your msg", msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("deleteMsg", (msgId) => {
  const toDlt = document.getElementById(msgId);
  toDlt.remove();
});

function loadMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.createdAt}</span></p><p class="text"> ${message.text} </p><img class="del" style="width: 30px; height: 50px; object-fit: contain"src="./assets/images/delete.png"/> <div class="btn btn-danger" id="btnl" style="display:none ;" > cant delete </div>
  `;
  div.setAttribute("id", message._id);
  if (message.username === username) {
    div.style.backgroundColor = "#a7f5cf";
  }
  document.querySelector(".chat-messages").appendChild(div);
  const divdlt = div.querySelector("#btnl");
  const deletBtn = div.querySelector(".del");
  deletBtn.addEventListener("click", async () => {
    console.log("here:", message._id, message.text);

    const res = await fetch(`${API_BASE_URL}/deleteMsg`, {
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
      console.log("hello", divdlt, message._id);

      divdlt.style.display = "block";

      setTimeout(() => {
        divdlt.style.display = "none";
      }, 2000);
    }
  });
}

function outputRoomName(room, room_name) {
  if (flag === true) {
    document.getElementById("deleteRoom").style.display = "block";
    roomName.innerHTML = room_name;
    roomParentDiv.style.display = "flex";
    roomCodeDiv.innerHTML = `${room}`;
    let code = roomCodeDiv.innerHTML;
    document.getElementById("room-admin").innerHTML = `Room Admin:  ${admin}`;
    document.getElementById("room-admin").style.display = "block";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code);
        console.log("Content copied to clipboard");
        alert("Copied the text: " + code);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    });
  } else {
    roomName.innerHTML = room;
  }
}

function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.setAttribute("id", user.username);

    li.innerText = user.username;
    if (user.username === username) {
      li.classList.add("clr");
    }
    userList.appendChild(li);
  });
}
function removeUser(username) {
  //console.log("username: ", username);
  const elem = document.getElementById(username);
  elem.remove();
  //console.log("hello");
}
document.getElementById("deleteRoom").addEventListener("click", async () => {
  const res = await fetch(`${API_BASE_URL}/deleteRoom`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({
      room,
      username,
    }),
  });
  if (res.ok) {
    document.getElementById("deleted-successfully").style.display = "block";
    //console.log("succesfullu deleted", username);
    // setTimeout(() => {
    //   window.location.href = "/room.html";
    // }, 2000);
  } else {
    document.getElementById("deleted-not").style.display = "block";
    setTimeout(() => {
      document.getElementById("deleted-not").style.display = "none";
    }, 2000);
  }
});
document.getElementById("audio-call").addEventListener("click", async (e) => {
  e.preventDefault();

  window.location.href = `/call.html?room=${room}&username=${username}&admin=${admin}&call=audio`;

  const res = await fetch(`${API_BASE_URL}/incomingCall`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      room,
      username,
      callType: "audio",
    }),
  });
});

document.getElementById("video-call").addEventListener("click", async (e) => {
  e.preventDefault();
  window.location.href = `/call.html?room=${room}&username=${username}&admin=${admin}&call=video`;
  const res = await fetch(`${API_BASE_URL}/incomingCall`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      room,
      username,
      callType: "video",
    }),
  });
});

document.getElementById("accept-call").addEventListener("click", (e) => {
  e.preventDefault();

  if (CALL_TYPE === "audio") {
    window.location.href = `/call.html?room=${room}&username=${username}&admin=${admin}&call=audio`;
  } else {
    window.location.href = `/call.html?room=${room}&username=${username}&admin=${admin}&call=video`;
  }
});
document.getElementById("leave-room").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = `/room.html?username=${username}`;
});
function endCall() {
  document.getElementById("call-ringing").pause();
  document.getElementById("call").style.display = "flex";
  document.getElementById("incoming-call").style.display = "none";
}
document.getElementById("reject-call").addEventListener("click", async (e) => {
  e.preventDefault();
  endCall();
  const res = await fetch(`${API_BASE_URL}/rejectCall`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      room,
    }),
  });
});

socket.on("end-call", ({ room }) => {
  console.log("call ended", room);
  endCall();
});
