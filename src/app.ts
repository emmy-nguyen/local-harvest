import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import Redis from "ioredis";
import path from "node:path";
import fs from "fs";
import Controller from "./interfaces/controller.interface";

class App {
  private _app: express.Application;
  private readonly _port: number = Number(process.env.PORT) || 8000;
  private readonly _staticPath: string = process.env.STATIC_PATH || "public";

  constructor(controllers: Controller[]) {
    dotenv.config();
    this._app = express();
    this.configureApp();
    this.initializeControllers(controllers);
    this.initializePageNotFound();
  }

  private configureApp() {
    this._app.set("view engine", "ejs");
    this.setViewsFromAreas(); 
    this.initializeStaticFiles();
    this.initializeUrlendcoded();
    this.initializeJson();
    this.initializeSession();
    // this.initializeSessionLogging();
  }

  private setViewsFromAreas() {
    const areasPath = path.join(__dirname, "areas");
    const viewPaths = fs
      .readdirSync(areasPath)
      .map((area) => path.join(areasPath, area, "views"))
      .filter(
        (viewsPath) =>
          fs.existsSync(viewsPath) && fs.statSync(viewsPath).isDirectory()
      );

    this._app.set("views", viewPaths);
  }

  private initializeStaticFiles() {
    this._app.use(express.static(this._staticPath));
  }

  private initializeUrlendcoded() {
    this._app.use(express.urlencoded({ extended: true }));
  }

  private initializeSession() {
    const redisUrl = process.env.REDIS_PUBLIC_URL || "";
    if(!redisUrl) {
      console.log('Redis URL is not set');
      throw new Error('REDIS_URL is not set')
    }
    const redisClient = new Redis(redisUrl);

    // const redisClient = new Redis(redisUrl, {
    //   retryStrategy: (times) => {
    //     const delay = Math.min(times * 50, 2000);
    //     console.log(`Retrying Redis connection in ${delay}ms...`);
    //     return delay;
    //   }
    // });

    redisClient.on('error', (error) => {
      console.error('Redis error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis');
    });

    redisClient.ping((err, result) => {
      if (err) {
        console.error('Redis PING error:', err);
      } else {
        console.log('Redis PING response:', result);
      }
    });

    // const sessionMiddleware = session({
    //   store: new RedisStore({ client: redisClient}),
    //   secret: process.env.SESSION_SECRET || "default_secret_key",
    //   resave: false,
    //   saveUninitialized: false,
    //   cookie: {
    //     maxAge: 24 * 60 * 60 * 1000,
    //     secure: process.env.NODE_ENV === "production",
    //     httpOnly: true,
    //     sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
    //   },
    // })

    // this._app.use((req, res, next) => {
    //   console.log('Session Middleware: Processing request');
    //   sessionMiddleware(req, res, next);
    // });
    this._app.use(
      session({
        store: new RedisStore({ client: redisClient}),
        secret: process.env.SESSION_SECRET || "default_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
        },
      })
    );
  }

  // private initializeSessionLogging() {
  //   this._app.use((req, res, next) => {
  //     console.log('Current session:', req.session);
  //     console.log('SessionID:', req.sessionID);
  //     next();
  //   })
  // }

  private initializeJson() {
    this._app.use(express.json());
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => this._app.use(controller.router));
  }

  private initializePageNotFound() {
    this._app.use((req, res, next) => {
      res.status(404).render("404", { url: req.originalUrl });
    });
  }



  public start() {
    this._app.listen(this._port, '0.0.0.0', () => {
      console.log(`App running at: http://0.0.0.0:${this._port}/ 🚀`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Redis URL: ${process.env.REDIS_PUBLIC_URL ? 'Set' : 'Not Set'}`);
      console.log(`Session Secret: ${process.env.SESSION_SECRET ? 'Set' : 'Using default'}`);
    });
  }
}

export default App;
