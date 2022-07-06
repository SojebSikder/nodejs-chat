import { Module } from "../../system/decorator";
import { InboxController } from "./inbox/inbox.controller";
import { UserController } from "./user/user.controller";

@Module({
  controllers: [UserController, InboxController],
})
export class AppModule {}
