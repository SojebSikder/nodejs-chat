import { Request, Response } from "express";
import { Controller, Get } from "../../../system/decorator";
import { decorateHtmlResponse } from "../../middlewares/common/decorateHtmlResponse";

@Controller("/public/")
export class PublicinboxController {
  //
  @Get("", { middleware: [decorateHtmlResponse()] })
  async index(req: Request, res: Response) {
    res.render("publicinbox");
  }
}
