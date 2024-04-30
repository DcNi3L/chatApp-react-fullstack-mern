import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { UserRoutes, MessageRoutes } from './routes/index.js';
import { WebSocketServer } from 'ws';
import { jwtSecret } from "./config/index.js";
import path from 'path';
import fs from 'fs';

//models from mongodb
import { Message } from './models/Message.js';

dotenv.config();
mongoose.connect(process.env.DATABASE_URL).then()
const __dirname = path.resolve();
const app = express();


app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

// routes
app.use('/', UserRoutes);
app.use('/messages', MessageRoutes);

const port = process.env.PORT || 5000;
const server = app.listen(port);
const wss = new WebSocketServer({ server });
console.log(`listening on port ${port}`);

//websocket server
wss.on('connection', (con, req) => {
  function notifyAboutOnlineUsers() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  con.isAlive = true;
  con.timer = setInterval(() => {
    con.ping();
    con.deathTimer = setTimeout(() => {
      con.isAlive = false;
      clearInterval(con.timer);
      con.terminate();
      notifyAboutOnlineUsers();
    }, 1000);
  }, 5000);

  con.on('pong', () => {
    clearTimeout(con.deathTimer);
  });

  // reading username and id
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenStr = cookies.split(';').find((str) => str.startsWith('token='));
    if (tokenStr) {
      const token = tokenStr.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, data) => {
          if (err) {
            con.send(JSON.stringify({ error: 'Expired token' }));
            con.send(JSON.stringify({ clearTokenCookie: true }));
            con.close();
          } else {
            const { userId, username } = data;
            con.userId = userId;
            con.username = username;
          }
        });
      }
    }
  }

  con.on('message', async (message) => {
    const msgData = JSON.parse(message.toString());
    const { recipient, text, file } = msgData;
    let fileName = null;

    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-');
      const currentTime = new Date().toLocaleTimeString().replace(/:/g, '-');
      fileName = `${parts[0]}_${currentDate}_${currentTime}.${ext}`;
      const path = __dirname + '/uploads/' + fileName;
      const bufferData = new Buffer(file.data.split(',')[1], 'base64');

      fs.writeFile(path, bufferData, () => {
        console.log('file saved ' + path);
      });
    }

    if (recipient && (text || file)) {
      const [msgDoc] = await Promise.all([Message.create({
        sender: con.userId,
        recipient,
        text,
        file: file ? fileName : null,
      })]);

      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: con.userId,
              recipient,
              file: file ? fileName : null,
              _id: msgDoc._id,
            })
          )
        );
    }
  });

  // notifying everyone about online
  notifyAboutOnlineUsers();
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});
