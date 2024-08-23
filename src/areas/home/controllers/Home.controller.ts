import express from "express";
import IController from "../../../interfaces/controller.interface";
import path from "path";
import ensureAuthenticated from "../../../middleware/authentication.middleware";
import { getProfileLink } from "../../../helper/profileLink";
import IHomeService from "../services/IHome.services";
import { shuffle } from "../../../helper/randomFunction";
import { Market } from "@prisma/client";
import { getDistance } from "../../../helper/getDistance";



// extend the Express request interface to include nearestMarket
declare global {
  namespace Express {
    interface Request {
      nearestMarket: Market | null;
    }
  }
}
class HomeController implements IController {
  public path = "/home";
  public router = express.Router();
  private _service: IHomeService;


  constructor(homeService: IHomeService) {
    this.initializeRoutes();
    this._service = homeService;
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.showHomepage);

    // this.router.get(`${this.path}`, ensureAuthenticated, this.showHomepage);
    this.router.post(`${this.path}`, ensureAuthenticated, this.showNearestMarket);
  }

  private showHomepage = async (req: express.Request, res: express.Response) => {
    try {
      const profileLink = getProfileLink(req, res);

      console.log('profileLink', profileLink);
      
      if (!profileLink) {
        console.log('No profile link, redirecting to /')
        res.redirect("/");
      } else {
        const allMarkets = await this._service.getAllMarkets();
        const shuffledMarkets = shuffle(allMarkets);
        const randomMarkets = shuffledMarkets.slice(0,2);
        const featuredMarket = shuffledMarkets[0];

        const allVendors = await this._service.getAllVendors();
        const shuffledVendors = shuffle(allVendors);
        const randomVendors = shuffledVendors.slice(0,2);

        const allAvailableProducts = await this._service.getAllAvailableProducts();
        const shuffledProducts = shuffle(allAvailableProducts);
        const randomProducts = shuffledProducts.slice(0,5);

        // set accountInfo to show on homepage
        let accountInfo: any;
        const session = req.session.userId;
        if(session?.vendorId !== 0 && session?.vendorId !== undefined) {
          const vendorId = session.vendorId;
          const vendorInfo = await this._service.findVendorById(vendorId);
          accountInfo = vendorInfo;
      
        } else if(session?.customerId !== 0 && session?.customerId !== undefined) {
          const customerId = session?.customerId;
          const customerInfo = await this._service.findCustomerById(customerId);
          accountInfo = customerInfo;
        }

        const nearestMarket = req.nearestMarket || null;
        res.render("home", { profileLink, randomMarkets, randomVendors, randomProducts, featuredMarket, nearestMarket, accountInfo, session:req.session });
      }
  } catch(error) {
    res.status(500).json({ message: "Failed to get home page", error})
  }
  };


  private showNearestMarket = async(req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
    const { lat, lng } = req.body;
    // if(req.session) {
    //   req.session.location = { lat, lng}
    // }
    console.log(req.body);

    if (lat == null || lng == null) {
      throw new Error("Latitude and longitude must be provided.");
    }

    let nearestMarket: Market | null = null;
    let shortestDistance = Infinity;

    const markets = await this._service.getAllMarkets();
    markets.forEach(market => {
      const distance = getDistance(lat, lng, market.latitude!, market.longitude!);
      if(distance < shortestDistance) {
        shortestDistance = distance;
        nearestMarket = market;
      }
    });
  
    // attach nearestMarket in req, to use later in homepage
    // req.nearestMarket = nearestMarket;
    res.json(nearestMarket);

    } catch(error) {
      res.status(500).json({ message: "Failed to get user's location", error });
    }
  };

}

export default HomeController;
