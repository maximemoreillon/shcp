import { floorplan_path } from "../config"
import { Request, Response } from "express"
export const get_floorplan = (req: Request, res: Response) => {
  res.sendFile(floorplan_path)
}

export const floorplan_upload = (req: Request, res: Response) => {
  res.send("OK")
}
