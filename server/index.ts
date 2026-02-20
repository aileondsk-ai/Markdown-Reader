import { app, initApp, log } from "./app";
import { serveStatic } from "./static";

(async () => {
  const httpServer = await initApp();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer!, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer!.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
