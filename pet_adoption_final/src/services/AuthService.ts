import { NextFunction, Request, Response } from "express";
import Token from "../models/Token";
import User from "../models/UserModel";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import passport from "passport";
import { VerifyEmail } from "../utils/VerifyEmail";
import bcrypt from "bcrypt";

//register service
export const registerService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { username, email, password, confirmPass } = req.body;
  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashPassword = await bcrypt.hash(password, salt);

  let errors: any = [];
  try {
    if (!username || !email || !password || !confirmPass) {
      errors.push({ message: "Input fields can't be empty!" });
    }
    if (password !== confirmPass) {
      errors.push({ message: "Password do not match!" });
    }
    if (password.length < 6) {
      errors.push({ message: "Password should be at least 6 characters!" });
    }
    if (errors.length > 0) {
      res.render("register", {
        errors,
        username,
        email,
        password,
        confirmPass,
      });
    } else {
      await User.findOne({ email: email }).then((user: any) => {
        if (user) {
          errors.push({ message: "Email already exists!" });
          res.render("register", {
            errors,
            username,
            email,
            password,
            confirmPass,
          });
        } else {
          const newUser: any = new User({
            username,
            email,
            password: hashPassword,
          });
          newUser.save().then(async (user: any) => {
            const token = await new Token({
              userId: user.id,
              token: crypto.randomBytes(32).toString("hex"),
            }).save();
            const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
            await VerifyEmail(
              user.email,
              "Verify your email address",
              url,
              req,
              res
            );
            // req.flash("success", "Please check your email to login!");
            // res.redirect("/register");
          });
        }
      });
    }
  } catch (error) {
    res.render("not-found", { error: "Something Wrong!" });
  }
};

//login service
export const loginService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
      req.login(user, { session: false }, async (error) => {
        if (err || !user) {
          req.flash("error", "Invalid email or password!");
          return res.redirect("/login");
        } else if (!user.verified) {
          req.flash("error", "You are not verified! Please check your email.");
          return res.redirect("/login");
        } else {
          const body = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profile: user.profile,
            isAdmin: user.isAdmin,
          };
          const token = jwt.sign(
            { user: body },
            String(process.env.JWTSECRET_KEY),
            {
              expiresIn: "7d",
            }
          );
          const expiryDate = new Date(Date.now() + 30 * 24 * 36000000);
          return res
            .cookie("access_token", token, {
              expires: expiryDate,
              httpOnly: true,
            })
            .status(200)
            .redirect("/");
        }
      });
    } catch (error: any) {
      res.render("not-found", { error: "Something Wrong!" });
    }
  })(req, res, next);
};

//logout service
export const logoutService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("access_token");
    req.flash("success", "Logged out Success!");
    res.redirect("/login");
  } catch (error: any) {
    res.render("not-found", { error: "Something Wrong!" });
  }
};

//verifed user from admin
export const approvedUserService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = await User.findById(req.params.id);
    const token: any = await Token.findOne({ userId: user._id });
    if (token) {
      await token.remove();
    }
    if (!user.verified) {
      await User.findByIdAndUpdate(req.params.id, { $set: { verified: true } });
      res.redirect("/admin");
    }
    if (user.verified) {
      await User.findByIdAndUpdate(req.params.id, {
        $set: { verified: false },
      });
      res.redirect("/admin");
    }
  } catch (error) {
    res.render("not-found", { error: "Something Wrong!" });
  }
};

//verify Admin
export const approvedAdminService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = await User.findById(req.params.id);
    if (!user.isAdmin) {
      await User.findByIdAndUpdate(req.params.id, { $set: { isAdmin: true } });
      res.redirect("/admin");
    }
    if (user.isAdmin) {
      await User.findByIdAndUpdate(req.params.id, {
        $set: { isAdmin: false },
      });
      res.redirect("/admin");
    }
  } catch (error) {
    res.render("not-found", { error: "Something Wrong!" });
  }
};
