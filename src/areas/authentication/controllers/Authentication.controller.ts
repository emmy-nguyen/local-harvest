import express from "express";
import IController from "../../../interfaces/controller.interface";
import {
  IVendorAuthenticationService,
  ICustomerAuthenticationService,
} from "../services/IAuthentication.service";
import type { Customer, Vendor } from "@prisma/client";

declare module "express-session" {
  interface SessionData {
    userId?: {
      vendorId?: number;
      customerId: number;
    };
    messages?: string;
  }
}

export class VendorAuthenticationController implements IController {
  public path = "/auth/vendor";
  public router = express.Router();
  private _service: IVendorAuthenticationService;

  constructor(service: IVendorAuthenticationService) {
    this.initializeRoutes();
    this._service = service;
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/login`, this.showVendorLoginPage);
    this.router.post(`${this.path}/login`, this.vendorLogin);
    this.router.get(`${this.path}/logout`, this.vendorLogout);
    //this.router.get(`${this.path}/register`, this.showRegistrationPage);
    //this.router.post(`${this.path}/register`, this.registration);
  }

  private showVendorLoginPage = (
    req: express.Request,
    res: express.Response
  ) => {
    const loginUrl = req.originalUrl;
    const errorMessage = req.session?.messages || null;
    req.session.messages = "";
    console.log(req.session)
    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    res.render("vendorLogin", { errorMessage, currentTime, loginUrl });
  };

  private vendorLogin = async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;
    const vendor = await this._service.findUserByEmail(email);
    if (vendor && password === vendor.password) {
      req.session.userId = { vendorId: vendor.vendorId, customerId: 0 };
      console.log(req.session); // Logging the session for debugging
      console.log('Session saved, attempting redirect');
      return res.redirect("/home");
  
    } else {
      req.session.messages = "Invalid credentials";
      res.redirect("/auth/vendor/login");
    }
  };

  private vendorLogout = async (req: express.Request, res: express.Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.redirect("/home");
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  };
}

export class CustomerAuthenticationController implements IController {
  public path = "/auth/customer";
  public router = express.Router();
  private _service: ICustomerAuthenticationService;

  constructor(service: ICustomerAuthenticationService) {
    this.initializeRoutes();
    this._service = service;
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/login`, this.showCustomerLoginPage);
    this.router.post(`${this.path}/login`, this.customerLogin);
    this.router.get(`${this.path}/logout`, this.customerLogout);
    //this.router.get(`${this.path}/register`, this.showRegistrationPage);
    //this.router.post(`${this.path}/register`, this.registration);
  }

  private showCustomerLoginPage = (
    req: express.Request,
    res: express.Response
  ) => {
    const errorMessage = req.session?.messages || "";
    req.session.messages = "";
    const loginUrl = req.originalUrl;
    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    res.render("customerLogin", {
      errorMessage,
      currentTime,
      loginUrl,
      userType: "Customer",
    });
  };

  private customerLogin = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { email, password } = req.body;
    const customer = await this._service.findUserByEmail(email);
    if (customer && password === customer.password) {
      req.session.userId = { vendorId: 0, customerId: customer.customerId };
      console.log(req.session); // Logging the session for debugging
      return res.redirect("/home");
    } else {
      req.session.messages = "Invalid credentials";
      res.redirect("/auth/customer/login");
    }
  };

  private customerLogout = async (req: express.Request, res: express.Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.redirect("/home");
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  };
  }

