import { logger } from './logger.service.js'
import { Server } from 'socket.io'

let gIo = null

export function setupSocketAPI(http) {
    gIo = new Server(http, {
        cors: {
            origin: '*',
        },
    });

    gIo.on('connection', (socket) => {
        logger.info(`New connected socket [id: ${socket.id}]`);

        socket.on('disconnect', () => {
            logger.info(`Socket disconnected [id: ${socket.id}]`);
        });

        socket.on('set-topic', (topic) => {
            if (socket.myTopic === topic) return;
            if (socket.myTopic) {
                socket.leave(socket.myTopic);
                logger.info(`Socket is leaving topic ${socket.myTopic} [id: ${socket.id}]`);
            }
            socket.join(topic);
            socket.myTopic = topic;
        });

        socket.on('chat-send-msg', (msg) => {
            logger.info(`New chat msg from socket [id: ${socket.id}], emitting to topic ${socket.myTopic}`);
            gIo.to(socket.myTopic).emit('chat-add-msg', msg);
        });

        socket.on('user-watch', (userId) => {
            logger.info(`user-watch from socket [id: ${socket.id}], on user ${userId}`);
            socket.join('watching:' + userId);
        });

        socket.on('set-user-socket', (userId) => {
            logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`);
            socket.userId = userId;
        });

        socket.on('unset-user-socket', () => {
            logger.info(`Removing socket.userId for socket [id: ${socket.id}]`);
            delete socket.userId;
        });

        socket.on('board-updated', (board) => {
            logger.info(`board updated ${board._id} ${socket}`);
            gIo.to(socket.myTopic).emit('board-changed', board);
        });

        socket.on('board-added', (board) => {
            logger.info(`Board added ${board._id}`);
            gIo.to(socket.myTopic).emit('board-added', board);
        });

        socket.on('board-removed', (board) => {
            logger.info(`Board removed ${board._id}`);
            gIo.to(socket.myTopic).emit('board-removed', board);
        });

        socket.on('task-updated', (task) => {
            logger.info(`task updated ${task._id} ${socket}`);
            gIo.to(socket.myTopic).emit('task-changed', task);
        });

    });
}

function emitTo({ type, data, label }) {
    if (label) gIo.to('watching:' + label.toString()).emit(type, data)
    else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
    userId = userId.toString()
    const socket = await _getUserSocket(userId)

    if (socket) {
        logger.info(`Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`)
        socket.emit(type, data)
    } else {
        logger.info(`No active socket for user: ${userId}`)
        // _printSockets()
    }
}

// If possible, send to all sockets BUT not the current socket
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, room = null, userId }) {
    userId = userId.toString()
    
    logger.info(`Broadcasting event: ${type}`)
    const excludedSocket = await _getUserSocket(userId)
    if (room && excludedSocket) {
        logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
        excludedSocket.broadcast.to(room).emit(type, data)
    } else if (excludedSocket) {
        logger.info(`Broadcast to all excluding user: ${userId}`)
        excludedSocket.broadcast.emit(type, data)
    } else if (room) {
        logger.info(`Emit to room: ${room}`)
        gIo.to(room).emit(type, data)
    } else {
        logger.info(`Emit to all`)
        gIo.emit(type, data)
    }
}

async function _getUserSocket(userId) {
    const sockets = await _getAllSockets()
    const socket = sockets.find((s) => s.userId === userId)
    return socket
}
async function _getAllSockets(exclude_socket_id = null) {
    // return all Socket instances
    const sockets = await gIo.fetchSockets()
    if(!exclude_socket_id)
        return sockets
    
    return sockets.filter(s => s.id !== exclude_socket_id)
}

async function _printSockets() {
    const sockets = await _getAllSockets()
    console.log(`Sockets: (count: ${sockets.length}):`)
    sockets.forEach(_printSocket)
}
function _printSocket(socket) {
    console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

export const socketService = {
    // set up the sockets service and define the API
    setupSocketAPI,
    // emit to everyone / everyone in a specific room (label)
    emitTo,
    // emit to a specific user (if currently active in system)
    emitToUser,
    // Send to all sockets BUT not the current socket - if found
    // (otherwise broadcast to a room / to all)
    broadcast,
}
