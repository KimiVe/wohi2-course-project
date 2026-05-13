const express = require('express');
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public')));
const app = express();
const PORT = process.env.PORT || 3000;
const postsRouter = require("./routes/posts");
const authRouter = require("./routes/auth");


const pinoHttp = require("pino-http");
const logger = require("./lib/logger");

app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url.startsWith("/uploads") },
}));

// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());


// Root path
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
// Error
app.use((req, res) => {
  res.json({msg: "Not found"});
});

// Start the server
app.listen(PORT, () => { 
 const logger = require("./lib/logger");
logger.info({ port: PORT }, "server listening")
});


// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
