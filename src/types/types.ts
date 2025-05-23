import { Request } from "express";

export interface AuthenticatedUserRequest extends Request{
    user?: any
}