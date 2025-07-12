// utils/s3SignedUrl.ts
import { s3, S3_BUCKET } from "./s3Client";

export function getSignedDownloadUrl(key: string) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: 60 * 5, // valid for 5 mins
    ResponseContentDisposition: "attachment",
  };

  return s3.getSignedUrl("getObject", params);
}
