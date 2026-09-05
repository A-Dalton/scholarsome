import * as winston from "winston";
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities
} from "nest-winston";

export const LoggerFactory = (appName: string) => {
  const config = {
    levels: {
      error: 0,
      debug: 1,
      warn: 2,
      data: 3,
      info: 4,
      verbose: 5,
      silly: 6,
      custom: 7
    },
    colors: {
      error: "red",
      debug: "blue",
      warn: "yellow",
      data: "grey",
      info: "green",
      verbose: "cyan",
      silly: "magenta",
      custom: "yellow"
    }
  };

  winston.addColors(config.colors);

  const consoleFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonModuleUtilities.format.nestLike(appName, {
        colors: true,
        prettyPrint: true
      })
  );

  return WinstonModule.createLogger({
    levels: config.levels,
    transports: [
      new winston.transports.Console({ format: consoleFormat, handleExceptions: true })
    ],
    level: "info"
  });
};
