const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.use(cors()); // use cors middleware

// Increase the limit if the payload is larger
app.use(express.json({ limit: '50mb' })); // You can adjust the size as needed
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Example of processing function
function processData(message) {
    // Decompress and convert message to JSON
    // Return processed data

    return message;
}

app.post('/webhook', (req, res) => {
    message = req.body;
    console.log('Received a POST request');
    console.log('Headers:', req.headers);
    console.log('Received message:', message);

    if (!req.body) {
        return res.sendStatus(400);
    }

    const processedData = processData(message);
    // Emit the data to all connected clients
    io.emit('streamData', processedData);

    res.status(200).end('Message received');

});

const port = 3000;

server.listen(port, () => console.log(`App is listening on port ${port}`));
