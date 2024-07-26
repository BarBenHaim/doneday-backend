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
    addGroup,
    updateGroup,
    removeGroup,
    addTask,
    updateTask,
    removeTask,
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

async function addGroup(boardId, groupTitle) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)

        const group = {
            _id: makeId(),
            title: groupTitle,
            tasks: [],
            style: {},
            archivedAt: null
        }

        board.groups.push(group)
        await collection.updateOne({ _id: ObjectId(boardId) }, { $set: { groups: board.groups } })
        return group
    } catch (err) {
        logger.error(`cannot add group to board ${boardId}`, err)
        throw err
    }
}

async function updateGroup(boardId, groupId, updatedGroup) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)
        
        const groupIdx = board.groups.findIndex(group => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        board.groups[groupIdx] = { ...board.groups[groupIdx], ...updatedGroup }
        await collection.updateOne({ _id: ObjectId(boardId) }, { $set: { groups: board.groups } })
        return board.groups[groupIdx]
    } catch (err) {
        logger.error(`cannot update group in board ${boardId}`, err)
        throw err
    }
}

async function removeGroup(boardId, groupId) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)
        
        const groupIdx = board.groups.findIndex(group => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        const removedGroup = board.groups.splice(groupIdx, 1)
        await collection.updateOne({ _id: ObjectId(boardId) }, { $set: { groups: board.groups } })
        return removedGroup
    } catch (err) {
        logger.error(`cannot remove group from board ${boardId}`, err)
        throw err
    }
}

async function addTask(boardId, groupId, task, isBottom=true) {
    try {
        console.log('service addTask1')

        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)
        console.log('service addTask2')

        const group = board.groups.find(group => group._id === groupId)
        if (!group) throw new Error('Group not found')
        
        console.log('service addTask3')
        const newTask = {
            _id: makeId(),
            ...task
        }
        console.log('service addTask4')

        if ( isBottom ) {
            group.tasks.push(newTask)
        } else {
            group.tasks.unshift(newTask)
        }

        console.log('service addTask5')
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        console.log('service addTask6')
        return newTask
    } catch (err) {
        logger.error(`cannot add task to group ${groupId} in board ${boardId}`, err)
        throw err
    }
}

async function updateTask(boardId, groupId, taskId, taskChanges) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)

        const group = board.groups.find(group => group._id === groupId)
        if (!group) throw new Error('Group not found')

        const taskIdx = group.tasks.findIndex(task => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')

        group.tasks[taskIdx] = { ...group.tasks[taskIdx], ...taskChanges }
        await collection.updateOne({ _id: ObjectId(boardId) }, { $set: { groups: board.groups } })
        return group.tasks[taskIdx]
    } catch (err) {
        logger.error(`cannot update task in group ${groupId} in board ${boardId}`, err)
        throw err
    }
}

async function removeTask(boardId, groupId, taskId) {
    try {

        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)
        const group = board.groups.find(group => group._id === groupId)
        if (!group) throw new Error('Group not found')
        const taskIdx = group.tasks.findIndex(task => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')
        const removedTask = group.tasks.splice(taskIdx, 1)
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return removedTask
    } catch (err) {
        logger.error(`cannot remove task from group ${groupId} in board ${boardId}`, err)
        throw err
    }
} 
