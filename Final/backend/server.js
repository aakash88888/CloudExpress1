const express = require('express');
const app = express();
const cors = require('cors');
const archiver = require('archiver');
const bodyParser = require('body-parser');
const path = require('path')
const fs = require('fs');
const Ajv = require('ajv');
const { count } = require('console');

const ajv = new Ajv();

const eventSchema = {
  type: 'object',
  properties: {
    type: { type: 'number' },
    data: {
      type: 'object',
      // Add your event data properties here
      // e.g., source: { type: 'number' }, ...
    },
    timestamp: { type: 'number' }
  },
  required: ['type', 'data', 'timestamp']
};

const validateEvent = ajv.compile(eventSchema);

let interval_num = 1

// app.use(cors({ origin: '*' }))
app.use(cors({
  origin: ['https://577cf92f.cloudexpress12.pages.dev', 'https://bc1b014f.cloudexpress16.pages.dev', 'http://127.0.0.1:5503'] // Replace with your allowed origins
}));

// app.use(bodyParser.json());

app.use(bodyParser.json({ limit: '50mb' })); // Adjust limit as needed


//For sending events data to server
app.post('/api/record', (req, res) => {
  const eventData = req.body;
  // const sessionId = req.headers['session-id']
  const eventsFolder = './record_data';

  const intervalCounterPath = path.join(__dirname, 'interval_cnt.txt');
  let currentFolder;

  const createFolder = async () => {
    try {

      if (!fs.existsSync(intervalCounterPath)) {
        intervalNum = 1;
        fs.writeFileSync(intervalCounterPath, intervalNum.toString());

        console.log('Interval counter file created.');
      } else {
        intervalNum = parseInt(fs.readFileSync(intervalCounterPath, 'utf8'));
      }

    currentFolder = `${eventsFolder}/interval_${intervalNum}`
    
      if (!fs.existsSync(currentFolder)) {
        fs.mkdirSync(currentFolder);
        console.log(`Folder created: ${currentFolder}`);

        // var counter = parseInt(sessionId);
        var counter = intervalNum;
        counter = counter + 1;
        fs.writeFileSync(intervalCounterPath, counter.toString());
      }

    } catch (err) {
      console.error('Error creating folder:', err);
      res.sendStatus(500);
      return;
    }
  };


  const savefiles = async () => {
    await createFolder();

    eventData.forEach(event => {
      const isValid = validateEvent(event);
      if (isValid) {
        const jsonString = JSON.stringify(event, null, 2);
        fs.writeFile(`${currentFolder}/${event.timestamp}.json`, jsonString, (err) => {
          if (err) {
            console.error('Error saving event:', err);
            res.sendStatus(500); // Internal server error
            return;
          }

          console.log(event)
          console.log(`Event saved to file: ${event.timestamp}.json`);
        });
      }
    });

    res.sendStatus(201); // Created
  }

  // const timestamps = eventData.map(event => event.event.timestamp);

  savefiles();
});


//-------------Get method without the validation for json files----------------------
// app.get('/api/replay/:interval', (req, res) => {
//   const interval = req.params.interval;
//   const recordDataPath = './record_data'
//   const intervalPath = path.join(recordDataPath, `interval_${interval}`);

//   fs.readdir(intervalPath, (err, files) => {
//     if (err) {
//       console.error('Error reading directory:', err);
//       res.status(500).send('Error reading directory');
//       return;
//     }

//     const filePromises = files.map(file => {
//       const filePath = path.join(intervalPath, file);
//       return new Promise((resolve, reject) => {
//         fs.readFile(filePath, 'utf8', (err, data) => {
//           if (err) {
//             reject(err);
//           } else {
//             resolve(JSON.parse(data));
//           }
//         });
//       });
//     });

//     Promise.all(filePromises)
//       .then(data => res.json(data))
//       .catch(err => {
//         console.error('Error reading files:', err);
//         res.status(500).send('Error reading files');
//       });
//   });
// });



//--------------------------Get method with Json file validations----------------------------
app.get('/api/replay/:interval', (req, res) => {
  const interval = req.params.interval;
  const recordDataPath = './record_data';
  const intervalPath = path.join(recordDataPath, `interval_${interval}`);

  fs.readdir(intervalPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Error reading directory');
      return;
    }

    const filePromises = files.map(file => {
      const filePath = path.join(intervalPath, file);

      return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {

          if (err) {
            reject(err);
          } else if (stats.size === 0) {
            console.warn(`Skipping empty file: ${filePath}`);
            resolve(null);
          } else {

            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) {
                reject(err);
              } else {
                try {
                  const parsedData = JSON.parse(data);
                  resolve(parsedData);
                } catch (error) {
                  console.error(`Error parsing file ${filePath}:`, error);
                  // Handle parsing error (e.g., send error response, log)
                  resolve(null); // Or any default value
                }
              }
            });
          }
        });
      });
    });

    Promise.all(filePromises)
      .then(data => res.json(data))
      .catch(err => {
        console.error('Error reading files:', err);
        res.status(500).send('Error reading files');
      });
  });
});



//Get counter value
app.get('/api/max-interval', (req, res) => {
  const filePath = path.join(__dirname, 'interval_cnt.txt');

  // Read the interval_cnt.txt file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return res.status(500).json({ error: 'Error reading the file' });
    }

    const maxInterval = parseInt(data.trim(), 10);

    if (isNaN(maxInterval)) {
      return res.status(400).json({ error: 'Invalid max interval value in file' });
    }

    res.json({ maxInterval });
  });
});



//Get subfolder names
const recordDataPath = path.join(__dirname, 'record_data');
app.get('/api/record-data-folders', (req, res) => {
  try {
    const subfolders = fs.readdirSync(recordDataPath);
    res.json(subfolders);
  } catch (err) {
    console.error('Error reading record data folder:', err);
    res.status(500).send('Error reading record data folder');
  }
});


// To delete the specified recorded data
app.delete('/api/delete-folder/:folderName', (req, res) => {
  const folderPath = path.join(recordDataPath, req.params.folderName);

  try {
    // Ensure the path is within the record_data directory
    if (!folderPath.startsWith(recordDataPath)) {
      return res.status(400).send('Invalid folder path');
    }

    // Recursively delete the folder and its contents
    fs.rmSync(folderPath, { recursive: true, force: true });
    res.sendStatus(204); // No content
  } catch (err) {
    console.error('Error deleting folder:', err);
    res.status(400).send('Error updating counter');
  }
});


//To update the counter in text file
app.post('/update-counter', (req, res) => {
  let increment = req.body['counterValue']; // Expecting { "increment": number } in the request body
  increment = parseInt(increment)

  if (typeof increment !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    fs.writeFileSync("interval_cnt.txt", increment.toString());
    res.json({ increment });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting folder');
  }
});


app.get('/download/record-data', (req, res) => {
  const directory = './record_data';

  const output = fs.createWriteStream('Recorded_Data.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });

  output.on('close', () => {
    console.log('Archive finished.');
  });

  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    res.status(500).send('Error creating zip file');
  });

  archive.pipe(output);

  archive.directory(directory, false); // Add directory to zip

  archive.finalize();

  // Once the archive has been finalized, send it to the client
  res.download('Recorded_Data.zip');
});


app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
