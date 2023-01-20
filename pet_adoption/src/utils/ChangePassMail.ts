import path from "path";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import { Request, Response } from "express";

export const SendMail = async (
  email: string,
  subject: string,
  text: string,
  req: Request,
  res: Response
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: String(process.env.HOST),
      service: String(process.env.SERVICE),
      port: Number(process.env.MAIL_PORT),
      secure: Boolean(process.env.SECURE),
      auth: {
        user: String(process.env.MAIL_CENTER),
        pass: String(process.env.MAIL_PASS),
      },
    });
    const handlebarOptions: any = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.join(__dirname, "../../src/views"),
        defaultLayout: false,
      },
      viewPath: path.join(__dirname, "../../src/views"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    var mailOptions = {
      from: `Pet Adobtion 🐕 <${process.env.MAIL_CENTER}>`,
      to: email,
      subject: subject,
      template: "changepass",
      context: {
        title: "Password Reset Link",
        text: text,
      },
    };
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    req.flash("success", "Please check your email to change password!");
  } catch (error) {
    console.log(`Email couldn't sent!`);
    req.flash("error", "Email Limit Filled. Please wait 24 hours.");
  }
};
