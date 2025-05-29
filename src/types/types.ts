import { Request } from "express";

export interface AuthenticatedUserRequest extends Request{
    user?: any
}

export interface AuthenticatedClientRequest extends Request {
    client?:any
}