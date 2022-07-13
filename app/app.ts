// external imports
import { Express } from "express";
import cookieParser from "cookie-parser";
// internal imports
// middleware imports
import bodyParser from "body-parser";
import { appConfig } from "../config/app";
import { WebSocket } from "../system";

/**
 * Use any middleware here
 */
export function boot(app: Express) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser(appConfig.cookieSecret));
  // custom middleware here

  const io = WebSocket.io();
  // socket
  // global variables, keeps the state of the app
  var sockets = {},
    users = {},
    strangerQueue = "false",
    peopleActive = 0,
    peopleTotal = 0;

  // helper functions, for logging
  function fillZero(val) {
    if (val > 9) return "" + val;
    return "0" + val;
  }
  function timestamp() {
    var now = new Date();
    return (
      "[" +
      fillZero(now.getHours()) +
      ":" +
      fillZero(now.getMinutes()) +
      ":" +
      fillZero(now.getSeconds()) +
      "]"
    );
  }

  // listen for connections
  io.on("connection", function (socket) {
    // store the socket and info about the user
    sockets[socket.id] = socket;
    users[socket.id] = {
      connectedTo: -1,
      isTyping: false,
    };

    // connect the user to another if strangerQueue isn't empty
    if (strangerQueue !== "false") {
      users[socket.id].connectedTo = strangerQueue;
      users[socket.id].isTyping = false;
      users[strangerQueue].connectedTo = socket.id;
      users[strangerQueue].isTyping = false;
      socket.emit("conn");
      sockets[strangerQueue].emit("conn");
      strangerQueue = "false";
    } else {
      strangerQueue = socket.id;
    }

    peopleActive++;
    peopleTotal++;
    console.log(timestamp(), peopleTotal, "connect");
    io.sockets.emit("stats", { people: peopleActive });

    socket.on("new", function () {
      // Got data from someone
      if (strangerQueue !== "false") {
        users[socket.id].connectedTo = strangerQueue;
        users[strangerQueue].connectedTo = socket.id;
        users[socket.id].isTyping = false;
        users[strangerQueue].isTyping = false;
        socket.emit("conn");
        sockets[strangerQueue].emit("conn");
        strangerQueue = "false";
      } else {
        strangerQueue = socket.id;
      }
      peopleActive++;
      io.emit("stats", { people: peopleActive });
    });

    // Conversation ended
    socket.on("disconn", function () {
      var connTo = users[socket.id].connectedTo;
      if (strangerQueue === socket.id || strangerQueue === connTo) {
        strangerQueue = "false";
      }
      users[socket.id].connectedTo = -1;
      users[socket.id].isTyping = false;
      if (sockets[connTo]) {
        users[connTo].connectedTo = -1;
        users[connTo].isTyping = false;
        sockets[connTo].emit("disconn", { who: 2 });
      }
      socket.emit("disconn", { who: 1 });
      peopleActive -= 2;
      io.emit("stats", { people: peopleActive });
    });
    socket.on("chat", function (message) {
      if (
        users[socket.id].connectedTo !== -1 &&
        sockets[users[socket.id].connectedTo]
      ) {
        sockets[users[socket.id].connectedTo].emit("chat", message);
      }
    });
    socket.on("typing", function (isTyping) {
      if (
        users[socket.id].connectedTo !== -1 &&
        sockets[users[socket.id].connectedTo] &&
        users[socket.id].isTyping !== isTyping
      ) {
        users[socket.id].isTyping = isTyping;
        sockets[users[socket.id].connectedTo].emit("typing", isTyping);
      }
    });

    socket.on("disconnect", function (err) {
      // Someone disconnected, ctoed or was kicked
      //console.log(timestamp(), socket.id+" disconnected");

      var connTo = users[socket.id] && users[socket.id].connectedTo;
      if (connTo === undefined) {
        connTo = -1;
      }
      if (connTo !== -1 && sockets[connTo]) {
        sockets[connTo].emit("disconn", {
          who: 2,
          reason: err && err.toString(),
        });
        users[connTo].connectedTo = -1;
        users[connTo].isTyping = false;
        peopleActive -= 2;
      }

      delete sockets[socket.id];
      delete users[socket.id];

      if (strangerQueue === socket.id || strangerQueue === connTo) {
        strangerQueue = "false";
        peopleActive--;
      }
      peopleTotal--;
      console.log(timestamp(), peopleTotal, "disconnect");
      io.emit("stats", { people: peopleActive });
    });
  });

  //end socket
}
