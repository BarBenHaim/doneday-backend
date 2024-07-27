import { logger } from '../../services/logger.service.js'
import { readJsonFile } from '../../services/util.service.js'
import { boardService as boardService } from './board.service.js'



export async function getBoards(req, res) {
    try {
		// const filterBy = {
		// 	txt: req.query.txt || '',
		// 	minSpeed: +req.query.minSpeed || 0,
        //     sortField: req.query.sortField || '',
        //     sortDir: req.query.sortDir || 1,
		// 	pageIdx: req.query.pageIdx,
		// }
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
	// const { loggedinUser, body: board } = req

	try {
		// board.owner = loggedinUser
		// logger.debug(req)
        const { body: board } = req
        const addedBoard = await boardService.addBoard(board)
        res.json(addedBoard)
	} catch (err) {
		logger.error('Failed to add board', err)
		res.status(400).send({ err: 'Failed to add board' })
	}
}

// export async function addBoard(req, res) {
//     try {
//         const board = {
//             ...req.body,
//             groups: req.body.groups.map(group => ({
//                 ...group,
//                 _id: new mongoose.Types.ObjectId(),
//                 tasks: group.tasks.map(task => ({
//                     ...task,
//                     _id: new mongoose.Types.ObjectId(),
//                     comments: task.comments.map(comment => ({
//                         ...comment,
//                         _id: new mongoose.Types.ObjectId(),
//                     })),
//                     checklists: task.checklists.map(checklist => ({
//                         ...checklist,
//                         _id: new mongoose.Types.ObjectId(),
//                         todos: checklist.todos.map(todo => ({
//                             ...todo,
//                             _id: new mongoose.Types.ObjectId(),
//                         })),
//                     })),
//                 })),
//             })),
//         }
//         const addedBoard = await boardService.add(board)
//         res.json(addedBoard)
//     } catch (err) {
//         logger.error('Failed to add board', err)
//         res.status(400).send({ err: 'Failed to add board' })
//     }
// }

export async function updateBoard(req, res) {
	// const { loggedinUser, body: board } = req
    // const { _id: userId, isAdmin } = loggedinUser

    // if(!isAdmin && board.owner._id !== userId) {
    //     res.status(403).send('Not your board...')
    //     return
    // }

	try {
		const boardId = req.params.boardId
		const boardChanges = req.body
        const updatedBoard = await boardService.updateBoard(boardId, boardChanges)
        res.json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update board', err)
		res.status(400).send({ err: 'Failed to update board' })
	}
}

export async function removeBoard(req, res) {
	try {
		const boardId = req.params.boardId
		const removedBoard = await boardService.removeBoard(boardId)
		res.send(removedBoard)
	} catch (err) {
		logger.error('Failed to remove board', err)
		res.status(400).send({ err: 'Failed to remove board' })
	}
}

export async function addBoardMsg(req, res) {
	// const { loggedinUser } = req

	try {
		const boardId = req.params.boardId
		const msg = {
			txt: req.body.txt,
			// by: loggedinUser,
		}
		const savedMsg = await boardService.addBoardMsg(boardId, msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to update board', err)
		res.status(400).send({ err: 'Failed to update board' })
	}
}

export async function removeBoardMsg(req, res) {
	try {
		const boardId = req.params.boardId
		const { msgId } = req.params

		const removedId = await boardService.removeBoardMsg(boardId, msgId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove board msg', err)
		res.status(400).send({ err: 'Failed to remove board msg' })
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
    try {
        const boardId = req.params.boardId
        const group = req.body  // Receive the whole body
        const newGroup = await boardService.addGroup(boardId, group)
        res.json(newGroup)  // Return the entire newGroup object
    } catch (err) {
        logger.error('Failed to add group', err)
        res.status(400).send({ err: 'Failed to add group' })
    }
}

export async function updateGroup(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const groupChanges = req.body
        const updatedGroup = await boardService.updateGroup(boardId, groupId, groupChanges)
        res.json(updatedGroup)
    } catch (err) {
        logger.error('Failed to update group', err)
        res.status(400).send({ err: 'Failed to update group' })
    }
}

export async function removeGroup(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const removedGroup = await boardService.removeGroup(boardId, groupId)
        res.json(removedGroup)
    } catch (err) {
        logger.error('Failed to remove group', err)
        res.status(400).send({ err: 'Failed to remove group' })
    }
}

export async function addTask(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const task = req.body
        const addedTask = await boardService.addTask(boardId, groupId, task)
        res.json(addedTask)
    } catch (err) {
        logger.error('Failed to add task', err)
        res.status(400).send({ err: 'Failed to add task' })
    }
}

export async function updateTask(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const taskChanges = req.body
        const updatedTask = await boardService.updateTask(boardId, groupId, taskId, taskChanges)
        res.json(updatedTask)
    } catch (err) {
        logger.error('Failed to update task', err)
        res.status(400).send({ err: 'Failed to update task' })
    }
}

export async function removeTask(req, res) {
    try {
        const boardId = req.params.boardId
        const groupId = req.params.groupId
        const taskId = req.params.taskId
        const removedTask = await boardService.removeTask(boardId, groupId, taskId)
        res.json(removedTask)
    } catch (err) {
        logger.error('Failed to remove task', err)
        res.status(400).send({ err: 'Failed to remove task' })
    }
}
  