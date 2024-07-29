import { logger } from '../../services/logger.service.js'
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
        // loggedinUser?.activites.push(getUserActivity(loggedinUser.username,'Added a board'))
        logger.debug(board)
        const addedBoard = await boardService.addBoard(board)

        const activity = getUserActivity(loggedinUser.fullname, 'added a board')
        await userService.addActivity(loggedinUser._id, activity)

        res.json(addedBoard)
    } catch (err) {
        logger.error('Failed to add board', err)
        res.status(400).send({ err: 'Failed to add board' })
    }
}

export async function updateBoard(req, res) {
    const { loggedinUser, body: board } = req
    // const { _id: userId, isAdmin } = loggedinUser
    try {
        // const board = req.body
        const updatedBoard = await boardService.updateBoard(board)

        const activity = getUserActivity(loggedinUser.fullname, 'updated a board')
        await userService.addActivity(loggedinUser._id, activity)

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

        const activity = getUserActivity(loggedinUser.fullname, 'removed a board')
        await userService.addActivity(loggedinUser._id, activity)

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

        const activity = getUserActivity(loggedinUser.fullname, 'added a group')
        await userService.addActivity(loggedinUser._id, activity)

        res.json(newGroup) // Return the entire newGroup object
    } catch (err) {
        logger.error('Failed to add group', err)
        res.status(400).send({ err: 'Failed to add group' })
    }
}

export async function updateGroup(req, res) {
    const { loggedinUser } = req;

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const groupChanges = req.body
        const updatedGroup = await boardService.updateGroup(boardId, groupId, groupChanges)

        const activity = getUserActivity(loggedinUser.fullname, 'updated a group');
        await userService.addActivity(loggedinUser._id, activity);

        res.json(updatedGroup)
    } catch (err) {
        logger.error('Failed to update group', err)
        res.status(400).send({ err: 'Failed to update group' })
    }
}

export async function removeGroup(req, res) {
    const { loggedinUser } = req;
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const removedGroup = await boardService.removeGroup(boardId, groupId)

        const activity = getUserActivity(loggedinUser.fullname, 'removed a group');
        await userService.addActivity(loggedinUser._id, activity);

        res.json(removedGroup)
    } catch (err) {
        logger.error('Failed to remove group', err)
        res.status(400).send({ err: 'Failed to remove group' })
    }
}

export async function addTask(req, res) {
    const { loggedinUser } = req;

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const task = req.body
        const addedTask = await boardService.addTask(boardId, groupId, task)

        const activity = getUserActivity(loggedinUser.fullname, 'added a task');
        await userService.addActivity(loggedinUser._id, activity);

        res.json(addedTask)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(400).send({ err: 'Failed to add task' })
    }
}

export async function updateTask(req, res) {
    const { loggedinUser } = req;

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const taskChanges = req.body
        const updatedTask = await boardService.updateTask(boardId, groupId, taskId, taskChanges)

        const activity = getUserActivity(loggedinUser.fullname, 'updated a task');
        await userService.addActivity(loggedinUser._id, activity);

        res.json(updatedTask)
    } catch (err) {
        logger.error('Failed to update task', err)
        res.status(400).send({ err: 'Failed to update task' })
    }
}

export async function removeTask(req, res) {
    const { loggedinUser } = req;

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const removedTask = await boardService.removeTask(boardId, groupId, taskId)

        const activity = getUserActivity(loggedinUser.fullname, 'removed a task');
        await userService.addActivity(loggedinUser._id, activity);

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
// console.log("req addComment", req)
// console.log("req.body addComment", req.body)

    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId

        console.log("req.params addComment", req.params)

        const comment = {
            title: req.body.title,
            byMember: {
                _id: loggedinUser._id,
                fullname: loggedinUser.fullname,
                imgUrl: loggedinUser.imgUrl,
            },
        }
        // console.log("comment", comment)

        const savedComment = await boardService.addComment(boardId, groupId, taskId, comment)

        res.json(savedComment)
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
        res.json(savedComment)
    } catch (err) {
        logger.error('Failed to update comment', err)
        res.status(400).send({ err: 'Failed to update comment' })
    }
}

// export async function addTaskComment(req, res) {
//     const { loggedinUser } = req

//     try {
//         const boardId = req.params.boardId
//         const groupId = req.params.groupId
//         const taskId = req.params.taskId
//         const comment = {
//             txt: req.body.txt,
//             by: loggedinUser,
//         }
//         const savedComment = await boardService.addTaskComment(boardId, groupId, taskId, comment)
//         res.json(savedComment)
//     } catch (err) {
//         logger.error('Failed to update board', err)
//         res.status(400).send({ err: 'Failed to update board' })
//     }
// }

// export async function removeTaskComment(req, res) {
//     try {
//         const boardId = req.params.boardId;
//         const groupId = req.params.groupId;
//         const taskId = req.params.taskId;
//         const commentId = req.params.commentId;

//         const removedId = await boardService.removeTaskComment(boardId, groupId, taskId, commentId);
//         res.send(removedId);
//     } catch (err) {
//         logger.error('Failed to remove task comment', err);
//         res.status(400).send({ err: 'Failed to remove task comment' });
//     }
// }
