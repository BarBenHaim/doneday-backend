import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 3

export const boardService = {
    query,
    getById,
    addBoard,
    updateBoard,
    removeBoard,
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

async function removeBoard(boardId) {
    // const { loggedinUser } = asyncLocalStorage.getStore()
    // const { _id: ownerId, isAdmin } = loggedinUser

    try {
        const collection = await dbService.getCollection('board')

        const deletedBoard = await collection.deleteOne({ _id: ObjectId.createFromHexString(boardId) })

        if (!deletedBoard.deletedCount) throw 'Not your board'

        return boardId
    } catch (err) {
        logger.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function addBoard(board) {
    try {
        const collection = await dbService.getCollection('board')

        const newBoardTemplate = _getEmptyBoard(board.title, board.label, board.createdBy)
        const newBoard = {
            ...newBoardTemplate,
            ...board,
        }
        console.log('addBoardService', newBoard)
        await collection.insertOne(newBoard)
        return newBoard
    } catch (err) {
        logger.error('cannot insert board', err)
        throw err
    }
}

async function updateBoard(board) {
    try {
        const {_id,  ...boardToUpdate } = board

        const collection = await dbService.getCollection('board')

        await collection.updateOne({ _id: ObjectId.createFromHexString(board._id) }, { $set: boardToUpdate })
        console.log("updateBoard backend service3")

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
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`cannot add board msg ${boardId}`, err)
        throw err
    }
}

async function addGroup(boardId, group) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)

        if (!group.title) {
            throw new Error('Group must have a title')
        }
        const newGroupTemplate = _getEmptyGroup()
        const newGroup = {
            _id: makeId(),
            ...newGroupTemplate,
            ...group,
        }

        board.groups.push(newGroup)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return newGroup
    } catch (err) {
        logger.error(`cannot add group to board ${boardId}`, err)
        throw err
    }
}

async function updateGroup(boardId, groupId, updatedGroup) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)

        const groupIdx = board.groups.findIndex((group) => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        board.groups[groupIdx] = { ...board.groups[groupIdx], ...updatedGroup }
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
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

        const groupIdx = board.groups.findIndex((group) => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        const removedGroup = board.groups.splice(groupIdx, 1)
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return removedGroup
    } catch (err) {
        logger.error(`cannot remove group from board ${boardId}`, err)
        throw err
    }
}

async function addTask(boardId, groupId, task) {
    try {
        const collection = await dbService.getCollection('board')
        const board = await getById(boardId)
        const group = board.groups.find((group) => group._id === groupId)
        if (!group) throw new Error('Group not found')
        const newTaskTemplate = _getEmptyTask()
        const newTask = {
            _id: makeId(),
            ...newTaskTemplate,
            ...task,
        }
        group.tasks.push(newTask)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
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

        const group = board.groups.find((group) => group._id === groupId)
        if (!group) throw new Error('Group not found')

        const taskIdx = group.tasks.findIndex((task) => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')

        group.tasks[taskIdx] = { ...group.tasks[taskIdx], ...taskChanges }
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
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
        const group = board.groups.find((group) => group._id === groupId)
        if (!group) throw new Error('Group not found')
        const taskIdx = group.tasks.findIndex((task) => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')
        const removedTask = group.tasks.splice(taskIdx, 1)
        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return removedTask
    } catch (err) {
        logger.error(`cannot remove task from group ${groupId} in board ${boardId}`, err)
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
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}

function _getEmptyBoard(boardTitle, boardLabel, createdBy) {
    const task1 = _createTask(boardLabel + ' 1', { status: 'Done', priority: 'High' })
    const task2 = _createTask(boardLabel + ' 2', { status: 'Working on it', priority: 'Medium' })
    const task3 = _createTask(boardLabel + ' 3')
    const task4 = _createTask(boardLabel + ' 4')
    const task5 = _createTask(boardLabel + ' 5')

    return {
        title: boardTitle,
        description:
            'Manage any type of project. Assign owners, set timelines and keep track of where your project stands.',
        isStarred: false,
        archivedAt: null,
        createdBy,
        label: boardLabel,
        members: [],
        groups: [
            _getEmptyGroup('Group Title', { backgroundColor: '#579bfc' }, [task1, task2, task3]),
            _getEmptyGroup('Group Title', { backgroundColor: '#a25ddc' }, [task4, task5]),
        ],
        activities: [],
        cmpsOrder: ['checkbox', 'title', 'description', 'status', 'dueDate', 'priority', 'memberIds', 'files'],
    }
}

function _getEmptyGroup(title, style = {}, tasks = []) {
    return {
        _id: makeId(),
        title,
        archivedAt: null,
        style,
        tasks,
    }
}

function _getEmptyTask(title = 'New Task') {
    return {
        _id: makeId(),
        title,
        description: '',
        status: 'Not Started',
        priority: 'Low',
        dueDate: null,
        members: [],
        labels: [],
        comments: [],
    }
}

export function _createTask(title, options = {}) {
    return {
        _id: makeId(),
        title,
        archivedAt: options.archivedAt || null,
        status: options.status || 'Not Started',
        priority: options.priority || 'Low',
        dueDate: options.dueDate || null,
        description: options.description || null,
        comments: options.comments || [],
        checklists: options.checklists || [],
        memberIds: options.memberIds || [],
        byMember: options.byMember || null,
        style: options.style || {},
    }
}
