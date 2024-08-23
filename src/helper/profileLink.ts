import { Request, Response } from "express";

export const getProfileLink = (req: Request, res: Response): string | undefined => {
  console.log('Session in getProfileLink:', req.session)  
  if (req.session && req.session.userId) {
      if (req.session.userId.vendorId && req.session.userId.vendorId !== 0) {
        return "/vendor/profile";
      } else if (req.session.userId.customerId && req.session.userId.customerId !== 0) {
        return "/customer/profile";
      }
    }
    console.log('No valid profile link found');
    return undefined; 
};
