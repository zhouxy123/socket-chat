# socket-chat
A basic chat app based on socket.io 

## clone:
```
git clone https://github.com/zhouxy123/socket-chat.git
```
```
cd socket-chat
```

## install express and socket.io
Make sure Node.JS is installed first.
```
npm install express@4
```
```
npm install socket.io
```

## get server address
Run the command on the terminal of server:
- Windows:
  ```
  ipconfig
  ```
- Mac/Linux:
  ```
  ifconfig | grep inet
  ```
  
## modify client html
Modify the server address in line 84 of index.html:
```
const socket = io('http://[your server ip address]:3000');
```

## start server
```
node index.js
```

Then, access http://[your server ip address]:3000 in the browser of a device that is in the same LAN as the server, you can use this app.

