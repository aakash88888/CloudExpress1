const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path')
const fs = require('fs');

let interval_num = 1

app.use(cors({ origin: 'http://127.0.0.1:5501' }));
app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(cors({ origin: 'https://cloud-express-8tvj.vercel.app' }));
app.use(cors({ origin: 'https://cloud-express-5o07m58sr-yashu-ranparias-projects.vercel.app' }));
app.use(bodyParser.json());


app.post('/api/record', (req, res) => {
  const eventData = req.body;
  const eventsFolder = './record_data';

  const intervalCounterPath = path.join(__dirname, 'interval_cnt.txt');
  let intervalNum;
  let currentFolder;
  const createFolder = async (folderName) => {
    try {

      if (!fs.existsSync(intervalCounterPath)) {
        intervalNum = 1;
        await fs.writeFileSync(intervalCounterPath, intervalNum.toString());

        console.log('Interval counter file created.');
      } else {
        intervalNum = await parseInt(fs.readFileSync(intervalCounterPath, 'utf8'));
      }
      
      folderName = `${eventsFolder}/interval_${intervalNum}`
      currentFolder = folderName
      if (!fs.existsSync(folderName)) {
        await fs.mkdirSync(folderName);
        console.log(`Folder created: ${folderName}`);
      }

      intervalNum++;
      await fs.writeFileSync(intervalCounterPath, intervalNum.toString());

    } catch (err) {
      console.error('Error creating folder:', err);
      res.sendStatus(500);
      return;
    }
  };


  const savefiles = async () => {
    // await createFolder(currentFolder);

    eventData.forEach(event => {
      fs.writeFile(`${eventsFolder}/${event.event.timestamp}.json`, JSON.stringify(event.event), (err) => {
        if (err) {
          console.error('Error saving event:', err);
          res.sendStatus(500); // Internal server error
          return;
        }
    
        console.log(eventData)
        console.log(`Event saved to file: ${event.event.timestamp}.json`);
      });
    });

    res.sendStatus(201); // Created
  }

  // const timestamps = eventData.map(event => event.event.timestamp);

  savefiles();
});



app.get('/api/replay/:interval', (req, res) => {
  const interval = req.params.interval;
  let intervalPath = path.join(__dirname, 'record_data', interval);
  intervalPath = './record_data'

  fs.readdir(intervalPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Error reading directory');
      return;
    }

    const filePromises = files.map(file => {
      const filePath = path.join(intervalPath, file);
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
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



app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
