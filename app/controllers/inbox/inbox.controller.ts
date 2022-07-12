import { Request, Response } from "express";
import { Auth, WebSocket } from "../../../system";
import { Controller, Get, Post } from "../../../system/decorator";
import { authorization } from "../../middlewares/authorization";
import { decorateHtmlResponse } from "../../middlewares/common/decorateHtmlResponse";
import { attachmentUpload } from "../../middlewares/common/upload";
import { InboxService } from "./inbox.service";

@Controller("/inbox")
export class InboxController {
  //
  @Get("", {
    middleware: [decorateHtmlResponse("Inbox"), authorization()],
  })
  async showInboxPage(req: Request, res: Response) {
    const user = Auth.userByCookie(req.signedCookies);
    const result = await InboxService.getInstance().getInbox({
      userId: user.userid,
    });
    res.render("inbox", { data: { conversation: result } });
  }

  @Get("/:conversationId", {
    middleware: [decorateHtmlResponse("Inbox"), authorization()],
  })
  async getMessages(req: Request, res: Response) {
    const user = Auth.userByCookie(req.signedCookies);
    const { conversationId } = req.query;
    const { message, conversation } =
      await InboxService.getInstance().getMessages({
        conversationId,
      });
    res.status(200).json({
      data: {
        messages: message,
        participant: conversation,
      },
      user: user.userid,
      conversation_id: req.params.conversation_id,
    });
  }

  @Post("/store-conversation", { middleware: [authorization()] })
  async createConversation(req: Request, res: Response) {
    const { receiverId } = req.body;
    const user = Auth.userByCookie(req.signedCookies);
    const result = await InboxService.getInstance().storeConversation({
      senderId: user.userid,
      receiverId: receiverId,
    });

    res.status(200).json({
      message: "Conversation was added successfully!",
    });
  }

  @Post("/send", {
    middleware: [authorization(), attachmentUpload("attachments")],
  })
  async sendMessage(req: Request, res: Response) {
    const user = Auth.userByCookie(req.signedCookies);
    const { message, conversationId } = req.body;
    if (message || (req.files && req.files.length > 0)) {
      const result = await InboxService.getInstance().storeMessage(req, res);

      let attachments = null;

      // emit socket event
      WebSocket.io().emit("message", {
        message: {
          conversation_id: Number(conversationId),
          sender: {
            id: Number(user.userid),
            name: user.username,
            avatar: user.avatar || null,
          },
          message: message,
          attachment: attachments,
          date_time: result.updatedAt,
        },
      });
      res.status(200).json({
        success: true,
        message: "Successful!",
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        // message: "message text or attachment is required!",
        message: "message text is required!",
      });
    }
  }
}
