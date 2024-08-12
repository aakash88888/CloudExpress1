var firstEvent = null;
var roomName = "SqFR5uoLEUX8Qzuo66xF686qxf23";
const PORT = 3001

const playerContainer = document.getElementById('player-container');
playerContainer.style.margin = '0 auto';
// playerContainer.style.position = 'absolute';
playerContainer.style.alignContent = "center"
playerContainer.style.textAlign = "center"
// playerContainer.style.transform = 'translate(-50%, -50%)';

const instructionText = document.getElementById('instruction-text');
const intervalInput = document.getElementById('interval-input');
const errorMessage = document.getElementById('error-message');
const submitButton = document.getElementById('submit-button');

let maxInterval;

// const serverURL = 'https://cloudexpress-5znb.onrender.com'
// const serverURL = `http://localhost:${PORT}`

const serverURL = 'https://backendfinal-freq.onrender.com'   //Final backend
  
async function fetchReplayData(interval) {
  const response = await fetch(`${serverURL}/api/replay/${interval}`);
  const data = await response.json();
  return data;
}

// Fetch max interval value from the backend
async function fetchMaxInterval() {
  try {
    const response = await fetch(`${serverURL}/api/max-interval`);
    const data = await response.json();
    maxInterval = data.maxInterval;
    console.log('Session ID:', sessionID);
  } catch (error) {
    console.error('Error fetching session ID:', error);
  }
}


//For showing the record_data
async function fetchFolderList() {
  const response = await fetch(`${serverURL}/api/record-data-folders`);
  const data = await response.json();

  const folderList = document.getElementById('folderList');
  folderList.style.width = "auto"
  while (folderList.hasChildNodes()) {
    folderList.removeChild('li');
  }

  data.forEach(folder => {
    const listItem = document.createElement('li');
    listItem.textContent = folder;
    listItem.style.cursor = "pointer"
    listItem.style.width = "auto"
    folderList.appendChild(listItem);

    listItem.addEventListener('click', () => {
      const confirmed = confirm(`Are you sure you want to delete ${folder}?`);
      if (confirmed) {
        deleteFolder(folder);
      }
    });

    folderList.appendChild(listItem);
  });
}

//Function to delete the folder
async function deleteFolder(folderName) {
  try {
    const response = await fetch(`${serverURL}/api/delete-folder/${folderName}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Update the UI to reflect the deleted folder
      fetchFolderList();
    } else {
      console.error('Error deleting folder:', response.statusText);
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
  }
}

//Button for fetching the events data to play
submitButton.addEventListener('click', async () => {
  const userInput = parseInt(intervalInput.value);

  if ((userInput < 1) || (userInput >= maxInterval)) {
    errorMessage.textContent = `Incorrect value. Please enter a value between 1 and ${maxInterval}.`;
    return;
  } else {
    errorMessage.textContent = ''; // Clear any previous error messages

    fetchReplayData(userInput)
      .then(data => {
        console.log(data); // Process the fetched data

        const filteredData = data.filter(event => event && event.type && event.timestamp); // Filter out invalid events
        console.log('Filtered data:', filteredData); // Log the filtered data

        if (filteredData.length < 2) {
          console.error('Insufficient events for playback. Minimum 2 required.');
          return; // Handle the case where there are less than 2 valid events
        } else if (filteredData.length > 3) {
          console.warn(`Data: `, filteredData[0]);

          let events = [];

          filteredData.forEach(element => {
            events.push(element);
          });

          player = new rrwebPlayer({
            target: document.getElementById('player-container'),
            props: {
              events
            },
          });
          player.play();
        }
      })
      .catch(error => {
        console.error('Error fetching replay data:', error);
      });
  }

});



// Initialize the page
(async () => {
  await fetchMaxInterval();
  instructionText.textContent = `Enter the interval number to play: `;
  fetchFolderList();
})();
