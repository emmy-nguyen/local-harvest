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
    this.initializeSession();
    this.initializeUrlendcoded();
    this.initializeJson();
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
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const redisClient = new Redis(redisUrl);

    

    redisClient.on('error', (error) => {
      console.error('Redis error:', error)
    });

    redisClient.ping((err, result) => {
      if (err) {
        console.error('Redis PING error:', err);
      } else {
        console.log('Redis PING response:', result);
      }
    });


    this._app.use(
      session({
        store: new RedisStore({ client: redisClient}),
        secret: process.env.SESSION_SECRET || "default_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: {
          maxAge: 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production",
          httpOnly: true
        },
      })
    );
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => this._app.use(controller.router));
  }

  private initializePageNotFound() {
    this._app.use((req, res, next) => {
      res.status(404).render("404", { url: req.originalUrl });
    });
  }

  private initializeJson() {
    this._app.use(express.json());
  }

  public start() {
    this._app.listen(this._port, '0.0.0.0', () => {
      console.log(`App running at: http://0.0.0.0:${this._port}/ 🚀`);
    });
  }
}

export default App;
