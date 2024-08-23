import { Request, Response, NextFunction } from "express";

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('Checking authentication...');
  console.log('Session', req.session);

  if (req.session && req.session.userId) {
    // Type assertion for session data
    const sessionData = req.session as { 
      userId: { vendorId?: number; customerId?: number };
      userType?: string;
    };
  console.log('UserId in session:', sessionData.userId)

    // Set userType based on session data
    if (sessionData.userId.vendorId) {
      sessionData.userType = 'vendor';
      console.log('Authenticated as vendor');

    } else if (sessionData.userId.customerId) {
      sessionData.userType = 'customer';
      console.log('Authenticated as customer')
    } else {
      console.log('Invalid user ID in session');
      return res.redirect("/");
    }
    console.log('Authentication successful, proceeding to next middle ware')
    return next();
  }
  console.log('Not authenticated, redirecting to home page')
  res.redirect("/");
}

export default ensureAuthenticated;
