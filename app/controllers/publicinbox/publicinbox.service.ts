import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Auth } from "../../../system/core";

const prisma = new PrismaClient();

export class PublicinboxService {
  private static _instance: PublicinboxService;
  /**
   * Create instance
   */
  public static getInstance() {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }
  /**
   * show all data
   */
  public async index() {}

  /**
   * show specific data
   * @param req
   * @param res
   */
  async show(arg_id: string) {}

  /**
   * store data
   * @param req
   * @param res
   */
  async store(req: Request, res: Response) {}
}
