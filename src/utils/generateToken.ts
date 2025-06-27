import crypto from "crypto";

export const generateOrderingToken = () => {
  return crypto.randomBytes(16).toString("hex");
};