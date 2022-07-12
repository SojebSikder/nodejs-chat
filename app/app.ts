// external imports
import { Express } from "express";
import cookieParser from "cookie-parser";
import { graphqlHTTP } from "express-graphql";
// internal imports
// middleware imports
import { rootResolver } from "../graphql/resolvers";
import { schema } from "../graphql/schema";
import bodyParser from "body-parser";
import { appConfig } from "../config/app";
import { ArrayHelper, WebSocket } from "../system";

/**
 * Use any middleware here
 */
export function boot(app: Express) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser(appConfig.cookieSecret));
  // custom middleware here

  // socket
  let users = [];
  let conversations = [];
  WebSocket.io().on("connection", function (socket) {
    let currentUser, currentConversation;
    console.log("A user connected");
    // set username
    // socket.on("setUsername", function (data) {
    //   console.log(data);
    //   if (users.indexOf(data) > -1) {
    //     socket.emit(
    //       "userExists",
    //       data + " username is taken! Try some other username."
    //     );
    //   } else {
    //     users.push(data);
    //     socket.emit("userSet", { username: data });
    //   }
    // });
    // set user id
    socket.on("setUserId", function (data) {
      console.log(data);

      let participant, conversation;

      let randParticipant = ArrayHelper.randomElement(users);
      if (data.userId == randParticipant) {
        randParticipant = ArrayHelper.randomElement(users);
      } else {
        participant = randParticipant;
      }

      let randConversation = ArrayHelper.randomElement(conversations);
      if (data.conversationId == randConversation) {
        randConversation = ArrayHelper.randomElement(conversations);
      } else {
        conversation = randConversation;
      }

      // set current user
      currentUser = data.userId;
      currentConversation = data.conversationId;

      if (users.indexOf(data.userId) > -1) {
        // if exists userid then emit userExists
        socket.emit("userExists", data.userId + " Please start again.");
      } else {
        users.push(data.userId);
        conversations.push(data.conversationId);
        
        socket.emit("userSet", {
          username: data.userId,
          participant: participant,
          conversation: conversation,
        });
      }
    });

    socket.on("msg", function (data) {
      //Send message to everyone
      WebSocket.io().sockets.emit("newmsg", data);
    });

    // when disconnect user
    socket.on("disconnect", function () {
      users = users.filter(function (v) {
        return v != currentUser;
      });
      conversations = conversations.filter(function (v) {
        return v != currentConversation;
      });
      console.log(`A user disconnected`, currentUser);
    });
  });

  //end socket

  // graphql endpoint
  app.use(
    "/graphql",
    graphqlHTTP({
      schema: schema,
      rootValue: rootResolver,
      graphiql: true,
    })
  );
}
