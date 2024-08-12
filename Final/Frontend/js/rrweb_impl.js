var cronyScript = document.createElement("SCRIPT");
cronyScript.src = "https://cdn.socket.io/4.4.1/socket.io.min.js";
cronyScript.type = "text/javascript";
document.getElementsByTagName("HEAD")[0].appendChild(cronyScript);
// import * as dotenv from 'dotenv';
// dotenv.config({ path: '../.env' });


// const PORT = process.env.PORT;
const PORT = 3001;
// const serverURL = 'https://cloudexpress-5znb.onrender.com'
const serverURL = 'https://backendfinal-freq.onrender.com'   //Final backend
// const serverURL = `http://localhost:${PORT}`

let sessionID;

// Fetch max interval value from the backend
async function fetchMaxInterval() {
  try {
    const response = await fetch(`${serverURL}/api/max-interval`);
    const data = await response.json();
    sessionID = data.maxInterval;
    console.log('Session ID:', sessionID);
  } catch (error) {
    console.error('Error fetching session ID:', error);
  }
}

// globle window funtion can be accessed from anywhere in the browser
window.cronyWidget = function (customConfig) {
  var { token, apiServer } = customConfig;

  var socket = io("https://backend-1wo2.onrender.com");
  var roomName = "SqFR5uoLEUX8Qzuo66xF686qxf23";

  //   var socket = io(apiServer);
  //   var roomName = token;

  var events = []
  console.log("crony script initiated.....");

  socket.on("connect", () => {
    // instruct a room name to be joined by server
    socket.emit("new-user", roomName);

    rrweb.record({
      emit(event) {
        console.log(event);
        // sent to room for agent
        events.push({ event });
        save(event)
        socket.emit("send-event", { event: event, room: roomName });
      },
    });

    function save(event) {
      const body = JSON.stringify(event);

      // events = [];

      // Send the event to your backend for storage
      fetch(`${serverURL}/api/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-id': sessionID
        },
        body: body,
      })
        .then(response => {
          console.log('Event sent successfully');
        })
        .catch(error => {
          console.error('Error sending event:', error);
        });
    }

    // save()

    // setInterval(save, 5 * 1000)

    window.addEventListener('beforeunload', (event) => {
      if (events.length > 0) {
        save();
      }
    });

    socket.on("agent-event", (data) => {
      console.log(data);
    });
  });
};

// Initialize the page
(async () => {
  await fetchMaxInterval();
})();