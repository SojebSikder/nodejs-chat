import { Request, Response } from "express";
import { Controller, Get } from "../../../system/decorator";

@Controller("/public/")
export class PublicinboxController {
  //
  @Get("")
  async index(req: Request, res: Response) {
    res.render("publicinbox");
  }
  @Get("/about")
  async about(req: Request, res: Response) {
    res.send("Hello world");
  }
}
