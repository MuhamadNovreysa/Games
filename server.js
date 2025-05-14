const express = require("express");
const socketIO = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let players = [];
let tasks = 0;

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Assign random role (10% chance jadi impostor)
    const isImpostor = Math.random() < 0.1;
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    const newPlayer = {
        id: socket.id,
        x: Math.random() * 800,
        y: Math.random() * 600,
        color,
        isImpostor,
        dead: false
    };
    players.push(newPlayer);

    // Kasih tau role ke player
    if (isImpostor) socket.emit("youAreImpostor");

    // Update semua player
    io.emit("updatePlayers", players);

    // Handle pergerakan player
    socket.on("move", (data) => {
        const player = players.find(p => p.id === socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            io.emit("updatePlayers", players);
        }
    });

    // Handle kill
    socket.on("kill", (targetId) => {
        const impostor = players.find(p => p.id === socket.id);
        const target = players.find(p => p.id === targetId);

        if (impostor && impostor.isImpostor && target && !target.dead) {
            target.dead = true;
            io.emit("updatePlayers", players);
            io.emit("startMeeting");
        }
    });

    // Handle tugas crewmate
    socket.on("doTask", () => {
        tasks++;
        io.emit("taskUpdated", tasks);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit("updatePlayers", players);
        console.log("Player disconnected:", socket.id);
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
