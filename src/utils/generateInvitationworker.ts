export const generateWorkerInviteLink = ({
  projectId,
  organizationId,
  role,
  specificRole,
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day,
  invitedBy,
  invitedByModel
}: {
  projectId: string;
  organizationId: string;
  role: string;
  expiresAt:Date;
  specificRole: string;
  invitedBy: string;
  invitedByModel: "UserModel" | "StaffModel" | "CTOModel";
}) => {

  const payload = {
    projectId,
    organizationId,
    role,
    specificRole,
    invitedBy,
    invitedByModel,
    expiresAt
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : "https://verticalliving.com";

  return `${baseUrl}/workerregister?invite=${encodedPayload}`;
};



