import { logger } from '../../services/logger.service.js'
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
		const boardId = req.params.id
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
		logger.debug(req)
		const addedBoard = await boardService.add(board)
		res.json(addedBoard)
	} catch (err) {
		logger.error('Failed to add board', err)
		res.status(400).send({ err: 'Failed to add board' })
	}
}

export async function updateBoard(req, res) {
	// const { loggedinUser, body: board } = req
    // const { _id: userId, isAdmin } = loggedinUser

    // if(!isAdmin && board.owner._id !== userId) {
    //     res.status(403).send('Not your board...')
    //     return
    // }

	try {
		const updatedBoard = await boardService.update(board)
		res.json(updatedBoard)
	} catch (err) {
		logger.error('Failed to update board', err)
		res.status(400).send({ err: 'Failed to update board' })
	}
}

export async function removeBoard(req, res) {
	try {
		const boardId = req.params.id
		const removedId = await boardService.remove(boardId)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove board', err)
		res.status(400).send({ err: 'Failed to remove board' })
	}
}

export async function addBoardMsg(req, res) {
	// const { loggedinUser } = req

	try {
		const boardId = req.params.id
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
		const boardId = req.params.id
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
	  const toys = utilService.readJsonFile('data/board.json')
	  let boardsToAdd = [...boards]
	  var boardsAdded = 0
  
	  await boardsToAdd.map((board) => {
		try {
		  delete board._id
		  boardService.add(board)
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