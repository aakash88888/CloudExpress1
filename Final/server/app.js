const { Server } = require("socket.io");
const { createServer } = require("http");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['https://cloud-express-8tvj.vercel.app',"https://cloud-express-8tvj-oayoj6a1v-yashu-ranparias-projects.vercel.app"],
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  socket.emit("hello", { greeting: "Hello Yashu!" });
  console.log("connected", socket.id);

  //join a room instructed by client
  socket.on("new-user", function (room) {
    console.log(room + " created...");
    socket.join(room);
  });

  //emit recevied message to specified room
  socket.on("send-event", function (data) {
    console.log("message from user in room... " + data.room);
    io.to(data.room).emit("user-event", data.event);
  });

  socket.on("receive-event", function (data) {
    console.log("message from agent in room... " + data.room);
    io.to(data.room).emit("agent-event", data.event);
  });

});

io.listen(3000);
console.log("socket io server started......");
