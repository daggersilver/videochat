const express = require('express');
const { createServer } = require('node:http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);
const views = path.join(__dirname, '/views');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('join-room.html', {root: views});
});

app.get('/:room', (req, res) => {
    res.sendFile('index.html', {root: views});
})

io.on('connection', (socket) => {
    socket.on('join-room', (room) => {
        socket.join(room);

        socket.to(room).emit('new-user', (socket.id));

        socket.on('disconnect', () => {
            socket.to(room).emit('user-left', socket.id);
        })
    });

    socket.on('video-offer', (data) => {
        io.to(data.target).emit('video-offer-receive', data);
    });

    socket.on('video-answer', (data) => {
        io.to(data.target).emit('video-answer', data);
    })

    socket.on('new-ice-candidate', (data) => {
        io.to(data.target).emit('receive-ice-candidate', data);
    });

});

server.listen(PORT, () => {
  console.log('server running at http://localhost:3000');
});

module.exports = app;