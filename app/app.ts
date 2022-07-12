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
import { WebSocket } from "../system";

/**
 * Use any middleware here
 */
export function boot(app: Express) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser(appConfig.cookieSecret));
  // custom middleware here
  //
  // socket
  let users = [];
  WebSocket.io().on("connection", function (socket) {
    console.log("A user connected");
    socket.on("setUsername", function (data) {
      console.log(data);
      if (users.indexOf(data) > -1) {
        socket.emit(
          "userExists",
          data + " username is taken! Try some other username."
        );
      } else {
        users.push(data);
        socket.emit("userSet", { username: data });
      }
    });
    socket.on("msg", function (data) {
      //Send message to everyone
      WebSocket.io().sockets.emit("newmsg", data);
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
