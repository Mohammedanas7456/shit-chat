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
require("dotenv").config();
const moment = require("moment");
const bcrypt = require("bcrypt");
const httpServer = createServer(app);
const jwt = require("jsonwebtoken");
let SOCKET;
console.log("SOCKET: ", SOCKET);

const io = new Server(httpServer, {
  /* options */
});

const publicRoutes = [
  "/signIn",
  "/signup",
  "/forgotPassword",
  "/userCreated",
  "/signin.html",
  "/room.html",
];

app.use(express.json());
//app.use(authenticateToken);
app.use(express.static(path.join(__dirname, "public")));

app.get("/getAllMessages", async (req, res) => {
  const adr = req.url;
  const q = url.parse(adr, true);
  const qdata = q.query;
  const room = qdata.room;
  console.log("ROOM", room);
  const allMsgs = await msgDb.find({ room: room });
  res.json(allMsgs);
});

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
});
const userDataBase = mongoose.model("user", schema);

app.post("/checkUsername", async (req, res) => {
  const userFind = await userDataBase.findOne({ name: req.body.username });
  if (!userFind) {
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

app.post("/userCreated", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log("salt", salt);
    console.log("hash pw", hashedPassword);
    const user = {
      name: req.body.username,
      password: hashedPassword,
      createdAt: Date.now(),
    };
    await userDataBase.create(user);
    res.status(201).send();
    console.log("hello");
  } catch (err) {
    console.log("error", err);
    res.status(500).send();
  }
});

const tokenScehma = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});
const tokenDataBase = mongoose.model("token", tokenScehma);

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
  totalMsgs: {
    type: Number,
    required: true,
  },
});
const roomDataBase = mongoose.model("Room", roomSchema);

app.post("/signIn", async (req, res) => {
  console.log("pw", req.body.password);
  try {
    const user = await userDataBase.findOne({ name: req.body.username });
    if (user === null) {
      res.status(400).send("cannot find user");
    }

    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(
        { name: user.name },
        process.env.ACCESS_TOKEN_SECRET
      );
      await tokenDataBase.create({ token: accessToken, name: user.name });
      console.log("access token", accessToken);
      res.json({ accessToken: accessToken });
    } else {
      console.log("not allowed", req.body.password);
      res.json({ accessToken: null });
    }
  } catch (err) {
    console.log("error", "pasword", req.body.password, err);
    res.status(500).send();
  }
});

// async function authenticateToken(req, res, next) {
//   console.log("req.url: ", req.url);
//   if (publicRoutes.includes(req.url)) return next();

//   //console.log("req header", req.headers);
//   const authHeader = req.headers["authorization"];
//   //console.log("headers", authHeader);
//   const token = authHeader && authHeader.split(" ")[1];
//   if (token === null) {
//     console.log("unauthenticated due to no token from client ");
//     //return res.sendStatus(401);
//   }
//   const dataBaseToken = await tokenDataBase.findOne({ token: token });
//   //console.log("token", token, "database token", dataBaseToken.token);
//   if (dataBaseToken === null) {
//     console.log("unauthenticated due to no token from database ");
//     //return res.status(403).send("not logged in");
//   }
//   if (token === dataBaseToken.token) {
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//       console.log(
//         "token ",
//         token,
//         "access token",
//         process.env.ACCESS_TOKEN_SECRET
//       );
//       if (err) {
//         console.log("err", err);
//         //return res.sendStatus(403);
//       }
//       req.user = user;
//       next();
//     });
//   } else {
//     return res.status(401).json({ err: "not found" });
//   }
// }

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
  const msg = {
    username: req.body.username,
    text: req.body.message,
    room: req.body.room,
    createdAt: moment().format("h:mm a"),
  };
  if (req.body.flag) {
    await roomDataBase.updateOne(
      { _id: req.body.room },
      { $inc: { totalMsgs: 1 } }
    );
  }
  const saved = await saveMsg(msg);
  console.log("saved", saved);
  io.to(req.body.room).emit("newMsg", saved);
});

app.post("/generateCode", async (req, res) => {
  const data = {
    name: req.body.roomName,
    createdBy: req.body.username,
    isDeleted: false,
    createdAt: moment().format("MMMM Do, YYYY"),
    totalMsgs: 0,
  };
  const room = await roomDataBase.create(data);
  console.log("roomId: ", room._id);
  res.send(room._id);
});
app.post("/verifyCode", async (req, res) => {
  const id = req.body.code;
  const data = await roomDataBase.findOne({ _id: id, isDeleted: false });
  console.log("data: ", data);
  if (data === null) {
    console.log("null data");
    res.sendStatus(404);
  } else {
    console.log("valid data");
    res.status(200).send(data);
  }
});

app.delete("/deleteRoom", async (req, res) => {
  const room = req.body.room;
  const updated = await roomDataBase.updateOne(
    { _id: req.body.room, createdBy: req.body.username },
    { isDeleted: true }
  );
  console.log("updated", updated);
  if (updated.modifiedCount === 1) {
    res.sendStatus(200);
    io.to(req.body.room).emit("deleteRoom", { room });
  } else res.sendStatus(400);
});

app.post("/myRooms", async (req, res) => {
  const rooms = await roomDataBase.find({
    createdBy: req.body.username,
    isDeleted: false,
  });
  console.log("rooms", rooms);

  if (rooms[0] === undefined) {
    console.log("hi", rooms[0]);
    res.sendStatus(400);
  } else {
    console.log("hello", rooms[0]);
    res.send(rooms);
  }
});

app.post("/incomingCall", (req, res) => {
  const room = req.body.room;
  const callType = req.body.callType;
  const username = req.body.username;
  //username = getUser(io.id);
  console.log("callTypes: ", callType);
  io.to(req.body.room).emit("incoming-call", { room, callType, username });
});

app.post("/endCall", (req, res) => {
  const room = req.body.room;
  const userName = req.body.username;
  //console.log("username: ", username);
  io.to(req.body.room).emit("end-call", { userName });
});

app.post("/rejectCall", (req, res) => {
  const room = req.body.room;

  io.to(room).emit("reject-call", { room });
});

app.post("/notAnswering", (req, res) => {
  const room = req.body.room;
  io.to(room).emit("notAnswering", { room });
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
});
const msgDb = mongoose.model("message", msgSchema);
async function saveMsg(msgData) {
  return await msgDb.create(msgData);
}

io.on("connection", (socket) => {
  if (SOCKET === undefined) {
    SOCKET = socket;
    console.log("SOCKET after: ", SOCKET);
  }
  console.log("new WS connection");
  socket.on("join-room", async ({ username, room }) => {
    console.log("room: ", room);

    console.log("username: ", username);
    const user = userJoin(socket.id, username, room);
    //console.log("room: ", room);
    socket.join(user.room);
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

  socket.on("join-room-for-call", (room, id) => {
    console.log("id: ", id);
    //io.to(room).emit("incoming-call", { room });
    console.log("room joined");
    socket.join(room);
    socket.to(room).emit("user-connected", id);

    socket.on("disconnect", () => {
      socket.to(room).emit("user-disconnected", id);
    });
  });

  socket.on("chat-message", (msg) => {
    user = getUser(socket.id);
  });

  // disconnect user
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
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
