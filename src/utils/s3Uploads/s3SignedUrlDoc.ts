// utils/s3SignedUrlDoc.ts
import { s3, S3_BUCKET } from "./s3Client";

export function getSignedViewUrlForPdf(key: string) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: 60 * 5, // valid for 5 mins
    // 👇 Don't include ResponseContentDisposition here
  };

  return s3.getSignedUrl("getObject", params);
}
