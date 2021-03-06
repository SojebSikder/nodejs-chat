import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Auth } from "../../../system";

const prisma = new PrismaClient();

export class InboxService {
  private static _instance: InboxService;
  /**
   * Create instance
   */
  public static getInstance() {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  async getInbox({ userId }) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            creatorId: userId,
          },
          {
            participantId: userId,
          },
        ],
      },
      include: {
        creator: true,
        participant: true,
      },
    });

    return conversations;
  }

  async getMessages({ conversationId }) {
    const message = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        text: true,
        createdAt: true,
        updatedAt: true,
        senderId: true,
        receiverId: true,
        conversationId: true,
        attachment: true,
        attachmentId: true,
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
      },
      include: {
        creator: true,
        participant: true,
      },
    });

    return { message, conversation };
  }

  async storeConversation({ senderId, receiverId }) {
    const result = await prisma.conversation.create({
      data: {
        creatorId: senderId,
        participantId: receiverId,
      },
    });

    return result;
  }

  async storeMessage(req: Request, res: Response) {
    const { conversationId, receiverId, message } = req.body;

    const user = Auth.userByCookie(req.signedCookies);

    const result = await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        senderId: Number(user.userid),
        receiverId: Number(receiverId),
        text: message,
      },
    });

    return result;
  }
}
