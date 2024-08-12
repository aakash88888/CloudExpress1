var cronyScript = document.createElement("SCRIPT");
cronyScript.src = "https://cdn.socket.io/4.4.1/socket.io.min.js"; // Remove this line
cronyScript.type = "text/javascript";
// Remove the script element if socket.io is not needed
// document.getElementsByTagName("HEAD")[0].appendChild(cronyScript);

// const PORT = process.env.PORT;
const PORT = 3001;
// const serverURL = 'https://cloudexpress-5znb.onrender.com'
const serverURL = 'https://backendfinal-freq.onrender.com'; // Final backend
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

window.cronyWidget = function (customConfig) {
  var { token, apiServer } = customConfig; // Remove unused variables

  var events = [];
  console.log("crony script initiated.....");

  rrweb.record({
    emit(event) {
      console.log(event);
      events.push(event);
      save(event);
    },
  });

  function save(event) {
    const body = JSON.stringify(event);

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

  window.addEventListener('beforeunload', (event) => {
    if (events.length > 0) {
      save(); // Send any remaining events before unload
    }
  });
};

// Initialize the page
(async () => {
  await fetchMaxInterval();
})();
