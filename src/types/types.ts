import { Request } from "express";

export interface AuthenticatedUserRequest extends Request{
    user?: any
}

export interface AuthenticatedClientRequest extends Request {
    client?:any
}


export interface AuthenticatedWorkerRequest extends Request {
    worker?:any
}

export interface AuthenticatedStaffRequest extends Request {
    staff?:any
}


export interface AuthenticatedCTORequest extends Request {
    CTO?:any
}


export interface RoleUserPayload {
  _id: string;
  role: "owner" | "staff" | "worker" | "CTO" | "client";
  ownerId?: string
}

export interface RoleBasedRequest extends Request {
  user?: RoleUserPayload;
}




export interface DocUpload{ type:"image" | "pdf" , url: string; originalName: string }[]
