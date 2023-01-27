const socket = io("/");
const username = new URLSearchParams(window.location.search).get("username");
console.log("username: ", username);
const room = new URLSearchParams(window.location.search).get("room");
const callType = new URLSearchParams(window.location.search).get("call");
const admin = new URLSearchParams(window.location.search).get("admin");
const API_BASE_URL = "http://" + window.location.host;
let ID;
let flag;
console.log("callType: ", callType);
const videoGrid = document.getElementById("video-grid");
if (callType === "video") {
  flag = true;
} else {
  flag = false;
}
console.log("flag: ", flag);
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});
const myVideo = document.createElement("video");
myVideo.style = "border-radius: 50%";
myVideo.muted = true;
const peers = {};
async function call() {
  const userStream = await navigator.mediaDevices
    .getUserMedia({
      video: flag,
      audio: true,
    })
    .then((stream) => {
      addVideoStream(myVideo, stream, document.getElementById("my-video-con"));

      myPeer.on("call", async (call) => {
        console.log("incoming call...");
        await call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", async (userVideoStream) => {
          await addVideoStream(video, userVideoStream);
        });
      });

      socket.on("user-connected", (userId) => {
        console.log("socket userId: ", userId);
        ID = userId;
        connectToNewUser(userId, stream);
      });
    });
  const mute = document.getElementById("mute");
  mute.addEventListener("click", () => {
    const videoTrack = userStream
      .getTracks()
      .find((track) => track.kind === "video");
    if (videoTrack.enabled) {
      videoTrack.enabled = false;
      mute.innerHTML = "hide cam";
    } else {
      videoTrack.enabled = true;
      mute.innerHTML = "show cam";
    }
  });
}
call();

myPeer.on("open", (id) => {
  socket.emit("join-room-for-call", room, id);
});

function connectToNewUser(userId, stream) {
  console.log("userId: ", userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  // call.on("error", (error) => {
  //   console.log("error: ", error);
  // });
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}
document.getElementById("end-call").addEventListener("click", async (e) => {
  e.preventDefault();
  window.location.href = `/chat.html?room=${room}&username=${username}&admin=${admin}`;
  const res = await fetch(`${API_BASE_URL}/endCall`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      room,
      username,
    }),
  });
});

function addVideoStream(video, stream, parent) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  if (parent) parent.append(video);
  else videoGrid.append(video);
}
socket.on("reject-call", () => {
  console.log("call rejected");
  document.getElementById("call-rejected").style.display = "block";
  setTimeout(() => {
    window.location.href = `/chat.html?room=${room}&username=${username}&admin=${admin}`;
  }, 2000);
});
socket.on("end-call", ({ userName }) => {
  console.log("user shaat", userName);
  document.getElementById("user-left").innerHTML = `${username} left the call`;
  document.getElementById("user-left").style.display = "block";
  setTimeout(() => {
    window.location.href = `/chat.html?room=${room}&username=${username}&admin=${admin}`;
  }, 3000);
});
socket.on("notAnswering", (room) => {
  console.log("not answering");
  document.getElementById("not-answering").style.display = "block";
  document.getElementById("retry").style.display = "inline";
  document.getElementById("hangUp").style.display = "inline";
  document.getElementById("end-call").style.display = "none";
});
document.getElementById("hangUp").addEventListener("click", () => {
  window.location.href = `/chat.html?room=${room}&username=${username}&admin=${admin}`;
});
document.getElementById("retry").addEventListener("click", async () => {
  document.getElementById("hangUp").style.display = "none";
  document.getElementById("not-answering").style.display = "none";
  document.getElementById("retry").style.display = "none";
  document.getElementById("end-call").style.display = "inline";
  const res = await fetch(`${API_BASE_URL}/incomingCall`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      room,
      username,
      callType: callType,
    }),
  });
});
