export const generateWorkerInviteLink = ({
  projectId,
  organizationId,
  role,
  expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day,
  invitedBy,
  invitedByModel
}: {
  projectId: string;
  organizationId: string;
  role: string;
  expiresAt:Date;
  invitedBy: string;
  invitedByModel: "UserModel" | "StaffModel" | "CTOModel";
}) => {

  console.log("organziatonID form invitatio link", organizationId)
  const payload = {
    projectId,
    organizationId,
    role,
    invitedBy,
    invitedByModel,
    expiresAt
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL
      : process.env.FRONTEND_URL;

  return `${baseUrl}/workerregister?invite=${encodedPayload}`;
};



