const username = new URLSearchParams(window.location.search).get("username");
console.log("username: ", username);

const API_BASE_URL = "http://" + window.location.host;

async function getRooms() {
  let rooms = await fetch(`${API_BASE_URL}/myRooms`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ username }),
  });
  if (rooms.ok) {
    rooms = await rooms.json();
  } else {
    console.log("anas");
    document.getElementById("noRoom").style.display = "block";
    setTimeout(() => {
      document.getElementById("noRoom").style.display = "none";
    }, 2000);
  }

  function renderRooms(rooms, parent) {
    const listGroup = document.createElement("div");
    listGroup.style = `text-align: right; width:300px`;

    rooms.forEach((room) => {
      const onClick = (e) => {
        e.preventDefault();
        console.log("button id", room._id);
        localStorage.setItem("flag", true);
        localStorage.setItem("roomName", room.name);
        window.location.href = `/chat.html?room=${room._id}&username=${username}&admin=${room.createdBy}`;
      };

      const item = document.createElement("a");
      item.setAttribute(
        "class",
        "list-group-item list-group-item-action active"
      );
      item.setAttribute("href", "#");
      item.id = room._id;
      item.onclick = onClick;
      item.style = `margin-bottom: 0.5rem;`;
      item.innerHTML = `
          <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${room.name}</h5>
              <small>${room.createdAt}</small>
          </div>
          <p class="mb-1">Room Code: ${room._id}</p>
          <small>Total Messages ${room.totalMsgs}</small>
          `;

      listGroup.classList.add("list-group");
      listGroup.appendChild(item);
    });

    parent.appendChild(listGroup);
  }

  renderRooms(rooms, document.getElementById("main-div"));
}
getRooms();
document.getElementById("back").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = `/room.html?username=${username}`;
});
