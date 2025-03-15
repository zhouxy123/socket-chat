const express = require('express');
const app = express(); // app is a function handler that you can supply to an HTTP server
const http = require('http');
const server = http.createServer(app); // HTTP server

// create a web socket server, and bind it on http server
// so the server can handle both HTTP and web socket requests
const { Server } = require("socket.io");
const io = new Server(server); 

// used user names
const usedNames = new Set();

// socket.id -> user name
const userMap = new Map();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // send index.html in current directory
});

// listen web socket connection from client
// when new user connected, call callback function
io.on('connection', (socket) => {
    let curUserName = 'user_' + socket.id; // current user name (socket.id is unique)
    let curRoomName = 'Default'; // current room name
    usedNames.add(curUserName);
    userMap.set(socket.id, curUserName);

    // notification when a new user connected
    console.log('User ' + curUserName + 'joins room: ' + curRoomName);

    // join default room 
    socket.join(curRoomName);

    // get users number in new room
    const roomInfo = io.sockets.adapter.rooms.get(curRoomName);
    const userCount = roomInfo ? roomInfo.size : 0;
    let newRoomMsg = "You are now in " + curRoomName + " (" + userCount + " users connected).";

    // get all users in new room
    const usersInfo = io.sockets.adapter.rooms.get(curRoomName);
    const userList = roomInfo ? Array.from(roomInfo).map(id => userMap.get(id) || id) : [];
    let newRoomUsersMsg = "Users connected: " + userList;
    
    // get rooms list
    const rooms = io.sockets.adapter.rooms;
    let availableRooms = 'Available chatrooms: ';
    rooms.forEach((sockets, room) => {
        if (!io.sockets.adapter.sids.get(room)) { // exclude default socket.id records
            availableRooms += (room + ' (' + sockets.size + '); ');
        }
    });

    // send available rooms list and current room information (only to the new user)
    // the difference between io.emit and socket.emit:
    // io.emit will send to all users; socket.emit will send to the current user
    socket.emit('available rooms', availableRooms);
    socket.emit('join message to self', {newRoomMsg, newRoomUsersMsg});

    // send new user information to others users in current room
    socket.to(curRoomName).emit('join message to others', curUserName + ' has joined ' + curRoomName + '. There are now ' + userCount + ' users in the room.');
    
    // event 'room': client send a room name
    socket.on('room', (roomname) => {
        socket.leave(curRoomName); // leave current room 

        // get old room's information and emit to old room
        const roomInfoOld = io.sockets.adapter.rooms.get(curRoomName);
        const userCountOld = roomInfoOld ? roomInfoOld.size : 0;
        socket.to(curRoomName).emit('leave message', curUserName + ' has left ' + curRoomName + '. There are now ' + userCountOld + ' users in the room.');

        curRoomName = roomname;
        socket.join(roomname); // join new room
        console.log('user ' + curUserName + ' joined room: ' + roomname);

        // get users number in new room
        const roomInfo = io.sockets.adapter.rooms.get(roomname);
        const userCount = roomInfo ? roomInfo.size : 0;
        let newRoomMsg = "You are now in " + roomname + " (" + userCount + " users connected).";

        // get all users in new room
        const userList = roomInfo ? Array.from(roomInfo).map(id => userMap.get(id) || id) : [];
        let newRoomUsersMsg = "Users connected: " + userList;

        socket.emit('join message to self', {newRoomMsg, newRoomUsersMsg});
        socket.to(curRoomName).emit('join message to others', curUserName + ' has joined ' + curRoomName + '. There are now ' + userCount + ' users in the room.');
    });

    // event 'chat message': client send a message
    // socket.on(...) can register a event listener on client's socket
    // when client send a 'chat message' event, call callback
    socket.on('chat message', (msg) => {
        let chatMsg = '[' + curRoomName + '] ' + curUserName + ': ' + msg;
        console.log(chatMsg); // print message in server (terminal)
        io.to(curRoomName).emit('chat message', chatMsg); // broadcast message to all users in current room
    });

    // event 'name': client send a user name
    socket.on('name', (username) => {
        console.log('new user name: ' + username);

        // check if the name is already used
        if (usedNames.has(username)) {
            console.log('name already used');
            socket.emit('name error', 'The name ' + username + ' is already in use.');
            return;
        }
        usedNames.delete(curUserName);
        usedNames.add(username);
        userMap.set(socket.id, username);
        socket.emit('name success', 'You are now known as ' + username);
        socket.to(curRoomName).emit('name change', curUserName + ' is now known as ' + username);
        curUserName = username;
        
    });

    // disconnect
    socket.on('disconnect', () => {
        const roomInfoOld = io.sockets.adapter.rooms.get(curRoomName);
        const userCountOld = roomInfoOld ? roomInfoOld.size : 0;
        socket.to(curRoomName).emit('leave message', curUserName + ' has left ' + curRoomName + '. There are now ' + userCountOld + ' users in the room.');

        usedNames.delete(curUserName);
        userMap.delete(socket.id);
        console.log('user disconnected');
    });
});

// start web server on port 3000
// if start successfully, print message in terminal
// all clients can connect to this server
server.listen(3000, () => {
    console.log('listening on *:3000');
}); 


