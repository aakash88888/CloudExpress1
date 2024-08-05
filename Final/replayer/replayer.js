// Assuming you have a button with id 'replayButton'
const replayButton = document.getElementById('replayButton');

replayButton.addEventListener('click', () => {
    const interval = 'interval_2'/* get filename from user input or other source */

    port_num = 3001
    fetch(`http://localhost:${port_num}/api/replay/${interval}`)
    .then(response => response.json())
    .then(events => {
      // Flatten the array of events from different files
      console.log(events)

      if (!Array.isArray(events)) {
        console.error('Received data is not an array of events');
        return; // Or handle the error as needed
      }
      const flattenedEvents = events.reduce((acc, eventsArray) => acc.concat(eventsArray), []);
      console.log(flattenedEvents)

      const replayer = new rrweb.Replayer(events,{
        target: document.body,
        muted: true,
      });

      replayer.play()
    })
    .catch(error => {
      console.error('Error fetching or parsing events:', error);
    });
});
