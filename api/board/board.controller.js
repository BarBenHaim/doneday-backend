import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { readJsonFile } from '../../services/util.service.js'
import { getUserActivity } from '../user/user.controller.js'
import { userService } from '../user/user.service.js'
import { boardService as boardService } from './board.service.js'

export async function getBoards(req, res) {
    try {
        const boards = await boardService.query()
        res.json(boards)
    } catch (err) {
        logger.error('Failed to get boards', err)
        res.status(400).send({ err: 'Failed to get boards' })
    }
}

export async function getBoardById(req, res) {
    try {
        const boardId = req.params.boardId
        const board = await boardService.getById(boardId)
        res.json(board)
    } catch (err) {
        logger.error('Failed to get board', err)
        res.status(400).send({ err: 'Failed to get board' })
    }
}

export async function addBoard(req, res) {
    const { loggedinUser, body: board } = req

    try {
        board.createdBy = loggedinUser
        const addedBoard = await boardService.addBoard(board)

        socketService.broadcast({ type: 'board-added', data: addedBoard, room: board._id, userId: loggedinUser._id })

        res.json(addedBoard)
    } catch (err) {
        logger.error('Failed to add board', err)
        res.status(400).send({ err: 'Failed to add board' })
    }
}

export async function updateBoard(req, res) {
    const { loggedinUser, body: board } = req
    try {
        const updatedBoard = await boardService.updateBoard(board)

        await boardService.logActivity(board._id, loggedinUser._id, 'update', 'board', board._id)
        
        socketService.broadcast({ type: 'board-changed', data: updatedBoard, room: board._id, userId: loggedinUser._id })

        res.json(updatedBoard)
    } catch (err) {
        logger.error('Failed to update board', err)
        res.status(400).send({ err: 'Failed to update board' })
    }
}

export async function removeBoard(req, res) {
    const { loggedinUser } = req
    try {
        const boardId = req.params.boardId
        const removedBoard = await boardService.removeBoard(boardId)

        await boardService.logActivity(boardId, loggedinUser._id, 'delete', 'board', boardId)

        socketService.broadcast({ type: 'board-removed', data: boardId, room: boardId, userId: loggedinUser._id })

        res.send(removedBoard)
    } catch (err) {
        logger.error('Failed to remove board', err)
        res.status(400).send({ err: 'Failed to remove board' })
    }
}

export async function initDB(req, res) {
    try {
        const board = readJsonFile('api/data/board.json')
        let boardsToAdd = [...board]
        var boardsAdded = 0

        await boardsToAdd.map((board) => {
            try {
                delete board._id
                boardService.addBoard(board)
                boardsAdded += 1
            } catch (err) {
                logger.error('Failed to add board', err)
            }
        })

        res.send(`${boardsAdded} boards added to db`)
    } catch (err) {
        logger.error('Failed to init DB', err)
        res.status(500).send({ err: 'Failed to init DB' })
    }
}

export async function addGroup(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const group = req.body // Receive the whole body
        const newGroup = await boardService.addGroup(boardId, group)

        await boardService.logActivity(boardId, loggedinUser._id, 'create', 'group', newGroup._id)

        socketService.broadcast({ type: 'group-added', data: newGroup, room: boardId, userId: loggedinUser._id })


        res.json(newGroup) // Return the entire newGroup object
    } catch (err) {
        logger.error('Failed to add group', err)
        res.status(400).send({ err: 'Failed to add group' })
    }
}

export async function updateGroup(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const groupChanges = req.body
        const updatedGroup = await boardService.updateGroup(boardId, groupId, groupChanges)

        await boardService.logActivity(boardId, loggedinUser._id, 'update', 'group', groupId)

        socketService.broadcast({ type: 'group-updated', data: updatedGroup, room: boardId, userId: loggedinUser._id })


        res.json(updatedGroup)
    } catch (err) {
        logger.error('Failed to update group', err)
        res.status(400).send({ err: 'Failed to update group' })
    }
}

export async function removeGroup(req, res) {
    const { loggedinUser } = req
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const removedGroup = await boardService.removeGroup(boardId, groupId)

        await boardService.logActivity(boardId, loggedinUser._id, 'delete', 'group', groupId)

        socketService.broadcast({ type: 'group-removed', data: removedGroup, room: boardId, userId: loggedinUser._id })


        res.json(removedGroup)
    } catch (err) {
        logger.error('Failed to remove group', err)
        res.status(400).send({ err: 'Failed to remove group' })
    }
}

export async function addTask(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const task = req.body
        const addedTask = await boardService.addTask(boardId, groupId, task)

        await boardService.logActivity(boardId, loggedinUser._id, 'create', 'task', addedTask._id)

        socketService.broadcast({ type: 'task-added', data: addedTask, room: boardId, userId: loggedinUser._id })


        res.json(addedTask)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(400).send({ err: 'Failed to add task' })
    }
}

export async function updateTask(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const taskChanges = req.body
        const updatedTask = await boardService.updateTask(boardId, groupId, taskId, taskChanges)

        await boardService.logActivity(boardId, loggedinUser._id, 'update', 'task', taskId)

        socketService.broadcast({ type: 'task-updated', data: updatedTask, room: boardId, userId: loggedinUser._id })


        res.json(updatedTask)
    } catch (err) {
        logger.error('Failed to update task', err)
        res.status(400).send({ err: 'Failed to update task' })
    }
}

export async function removeTask(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const removedTask = await boardService.removeTask(boardId, groupId, taskId)

        await boardService.logActivity(boardId, loggedinUser._id, 'delete', 'task', taskId)

        socketService.broadcast({ type: 'task-removed', data: removedTask, room: boardId, userId: loggedinUser._id })


        res.json(removedTask)
    } catch (err) {
        logger.error('Failed to remove task', err)
        res.status(400).send({ err: 'Failed to remove task' })
    }
}

export async function getComments(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const comments = await boardService.getComments(boardId, groupId, taskId)
        res.json(comments)
    } catch (err) {
        logger.error('Failed to get comments', err)
        res.status(400).send({ err: 'Failed to get comments' })
    }
}

export async function addComment(req, res) {
    const { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId

        var comment = req.body
        comment.byMember = loggedinUser._id
        comment = await boardService.addComment(boardId, groupId, taskId, comment)
        comment.byMember = loggedinUser

        await boardService.logActivity(boardId, loggedinUser._id, 'create', 'comment', comment._id)

        socketService.broadcast({ type: 'comment-added', data: comment, room: boardId, userId: loggedinUser._id })
  
        res.json(comment)
    } catch (err) {
        logger.error('Failed to add comment', err)
        res.status(400).send({ err: 'Failed to add comment' })
    }
}

export async function deleteComment(req, res) {
    var { loggedinUser } = req

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const commentId = req.params.commentId
        const removedId = await boardService.deleteComment(boardId, groupId, taskId, commentId, loggedinUser._id)

        if (removedId) {

            await boardService.logActivity(boardId, loggedinUser._id, 'delete', 'comment', commentId)

            socketService.broadcast({ type: 'comment-removed', data: commentId, room: boardId, userId: loggedinUser._id })

            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove comment' })
        }
        res.send(removedId)
    } catch (err) {
        logger.error('Failed to delete comment', err)
        res.status(400).send({ err: 'Failed to delete comment' })
    }
}

export async function updateComment(req, res) {
    const { loggedinUser } = req
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const commentId = req.params.commentId
        const updatedComment = req.body

        const savedComment = await boardService.updateComment(
            boardId,
            groupId,
            taskId,
            commentId,
            updatedComment,
            loggedinUser._id
        )

        await boardService.logActivity(boardId, loggedinUser._id, 'update', 'comment', commentId)

        socketService.broadcast({ type: 'comment-update', data: savedComment,room: boardId, userId: loggedinUser._id })

        res.json(savedComment)
    } catch (err) {
        logger.error('Failed to update comment', err)
        res.status(400).send({ err: 'Failed to update comment' })
    }
}

export async function getBoardActivities(req, res) {
    try {
        const boardId = req.params.boardId
        const activities = await boardService.getBoardActivities(boardId)
        res.json(activities)
    } catch (err) {
        logger.error('Failed to get board activities', err)
        res.status(400).send({ err: 'Failed to get board activities' })
    }
}
