import express, { Request, Response } from "express";
import { getSignedDownloadUrl } from "../../utils/s3Uploads/s3SignedUrl"; 

const downloadRouter = express.Router();

downloadRouter.get("/api/download-url", async (req: Request, res: Response):Promise<any> => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: "Missing key" });
  }

  const url = getSignedDownloadUrl(key as string);
  res.json({ url });
});


export default downloadRouter;
