import { Request, Response } from "express";
import { Controller, Get } from "../../../system/decorator";
import { decorateHtmlResponse } from "../../middlewares/common/decorateHtmlResponse";

@Controller()
export class PublicinboxController {
  //
  @Get("/public", { middleware: [decorateHtmlResponse("Anonymous")] })
  async anonymous(req: Request, res: Response) {
    res.render("publicinbox");
  }

  @Get("/private", { middleware: [decorateHtmlResponse("Chat with private")] })
  async linkedchat(req: Request, res: Response) {
    res.render("privateinbox");
  }
}
