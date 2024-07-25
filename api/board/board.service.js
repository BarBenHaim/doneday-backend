import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const boardService = {
	remove,
	query,
	getById,
	add,
	update,
	addBoardMsg,
	removeBoardMsg,
}

async function query(filterBy = { txt: '' }) {
	try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('board')
		var boardCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			boardCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const boards = boardCursor.toArray()
		return boards
	} catch (err) {
		logger.error('cannot find boards', err)
		throw err
	}
}

async function getById(boardId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(boardId) }

		const collection = await dbService.getCollection('board')
		const board = await collection.findOne(criteria)
        
		board.createdAt = board._id.getTimestamp()
		return board
	} catch (err) {
		logger.error(`while finding board ${boardId}`, err)
		throw err
	}
}

async function remove(boardId) {
    // const { loggedinUser } = asyncLocalStorage.getStore()
    // const { _id: ownerId, isAdmin } = loggedinUser

	try {
        const criteria = { 
            _id: ObjectId.createFromHexString(boardId), 
        }
        // if(!isAdmin) criteria['owner._id'] = ownerId
        
		const collection = await dbService.getCollection('board')
		const res = await collection.deleteOne(criteria)

        if(res.deletedCount === 0) throw('Not your board')
		return boardId
	} catch (err) {
		logger.error(`cannot remove board ${boardId}`, err)
		throw err
	}
}

async function add(board) {
	try {
		const collection = await dbService.getCollection('board')
		await collection.insertOne(board)

		return board
	} catch (err) {
		logger.error('cannot insert board', err)
		throw err
	}
}

async function update(board) {
    const boardToSave = { title: board.title, description: board.description }

    try {
        const criteria = { _id: ObjectId.createFromHexString(board._id) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $set: boardToSave })

		return board
	} catch (err) {
		logger.error(`cannot update board ${board._id}`, err)
		throw err
	}
}

async function addBoardMsg(boardId, msg) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(boardId) }
        msg.id = makeId()
        
		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $push: { msgs: msg } })

		return msg
	} catch (err) {
		logger.error(`cannot add board msg ${boardId}`, err)
		throw err
	}
}

async function removeBoardMsg(boardId, msgId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(boardId) }

		const collection = await dbService.getCollection('board')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId }}})
        
		return msgId
	} catch (err) {
		logger.error(`cannot add board msg ${boardId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
    const criteria = {
        title: { $regex: filterBy.txt, $options: 'i' },
        description: { $regex: filterBy.txt, $options: 'i' },
    }

    return criteria
}

function _buildSort(filterBy) {
    if(!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}