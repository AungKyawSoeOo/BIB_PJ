import { NextFunction, Request, Response } from "express";
import {
  loginService,
  logoutService,
  registerService,
  approvedAdminService,
  approvedUserService,
} from "../services/AuthService";

//register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  registerService(req, res, next);
};

//login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  loginService(req, res, next);
};

//logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logoutService(req, res, next);
};

//approved admin
export const approvedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  approvedUserService(req, res, next);
};

//approved admin
export const approvedAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  approvedAdminService(req, res, next);
};
