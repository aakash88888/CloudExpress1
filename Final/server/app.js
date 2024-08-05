const { Server } = require("socket.io");
const { createServer } = require("http");

const httpServer = createServer();

const allowedOrigins = [
  "https://cloud-express-8tvj.vercel.app",
  "https://cloud-express-5o07m58sr-yashu-ranparias-projects.vercel.app",
  // Add other allowed origins here if needed
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true // Allow credentials if necessary
  },
});

io.on("connection", (socket) => {
  socket.emit("hello", { greeting: "Hello Yashu!" });
  console.log("connected", socket.id);

  // Join a room instructed by client
  socket.on("new-user", (room) => {
    console.log(room + " created...");
    socket.join(room);
  });

  // Emit received message to specified room
  socket.on("send-event", (data) => {
    console.log("message from user in room... " + data.room);
    io.to(data.room).emit("user-event", data.event);
  });

  socket.on("receive-event", (data) => {
    console.log("message from agent in room... " + data.room);
    io.to(data.room).emit("agent-event", data.event);
  });
});

httpServer.listen(3000, () => {
  console.log("Socket.IO server started on port 3000...");
});
