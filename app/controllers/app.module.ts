import { Module } from "../../system/decorator";
import { InboxController } from "./inbox/inbox.controller";
import { PublicinboxController } from "./publicinbox/publicinbox.controller";
import { UserController } from "./user/user.controller";

@Module({
  controllers: [UserController, InboxController, PublicinboxController],
})
export class AppModule {}
