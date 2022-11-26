const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const formatMessage = require("./utils/message");
const botName = "chatcord-Bot";
const { userJoin, getUser, userLeave, getRoomUsers } = require("./utils/user");
const mongoose = require("mongoose");
const { time } = require("console");
const MONGO_URL =
  "mongodb+srv://mohammedanas:mastermind147@chat-api.lebps3w.mongodb.net/?retryWrites=true&w=majority";
const url = require("url");
//let Socket = null;

const app = express();
const moment = require("moment");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/getAllMessages", async (req, res) => {
  const adr = req.url;
  const q = url.parse(adr, true);
  const qdata = q.query;
  const room = qdata.room;
  console.log("ROOM", room);
  const allMsgs = await msgDb.find({ room: room });
  //const msgsObj = { msgs: allMsgs };
  //console.log("all msgs", msgsObj);
  res.json(allMsgs);
});

app.delete("/deleteMsg", async (req, res) => {
  const id = await req.body._id;
  console.log("id: ", id);
  if (id !== undefined && req.body.username === req.body.msgUser) {
    const deleted = await msgDb.deleteOne({ _id: id });
    console.log("dltd", deleted);
    io.to(req.body.room).emit("deleteMsg", id);
    res.json(deleted);
  } else {
    console.log("cant dlt msg");
    res.sendStatus(401);
  }
});

app.post("/newMsg", async (req, res) => {
  //user = getUser(Socket.id);
  const msg = {
    username: req.body.username,
    text: req.body.message,
    room: req.body.room,
    createdAt: moment().format("h:mm a"),
    //id: Math.floor(Math.random() * 10000000000),
  };
  const saved = await saveMsg(msg);
  console.log("saved", saved);
  io.to(req.body.room).emit("newMsg", saved);
});

const msgSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
  // id: {
  //   type: Number,
  //   required: true,
  // },
});
const msgDb = mongoose.model("message", msgSchema);
async function saveMsg(msgData) {
  return await msgDb.create(msgData);
}

io.on("connection", (socket) => {
  //Socket = socket;
  console.log("new WS connection");
  socket.on("join-room", async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    //console.log(socket.id, username, room);
    socket.join(user.room);

    //const msgsObj = { allMsgs: allMsgs };

    //console.log("ALL msgs", msgsObj);

    socket.emit("message", formatMessage(botName, "welcome to chat!"));

    // new user notifier
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    io.to(user.room).emit("roomusers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chat-message", (msg) => {
    user = getUser(socket.id);
    // const msgData = {
    //   username: user.username,
    //   text: msg,
    //   room: user.room,
    //   createdAt: moment().format("h:mm a"),
    //   id: Math.floor(Math.random() * 10000000000),
    // };
    // saveMsg(msgData);
    // io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // disconnect user
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
      socket.broadcast.to(user.room).emit("userLeft", user.username);
    }
  });
});

async function startServer() {
  await mongoose.connect(MONGO_URL, () => {
    console.log("mongoose connection ready");
  });
}

startServer();
httpServer.listen(3321);
module.exports = saveMsg;
