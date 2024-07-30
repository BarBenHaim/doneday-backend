import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import Board from './modal/board.model.js'

const BOARD_COLLECTION_NAME = 'board'

export const boardService = {
    query,
    getById,
    addBoard,
    updateBoard,
    removeBoard,
    addGroup,
    updateGroup,
    removeGroup,
    addTask,
    updateTask,
    removeTask,
    getComments,
    addComment,
    updateComment,
    deleteComment,
    logActivity,
    getBoardActivities,
}

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
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

        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
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
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)

        const deletedBoard = await collection.deleteOne({ _id: ObjectId.createFromHexString(boardId) })

        if (!deletedBoard.deletedCount) throw 'Not your board'

        return boardId
    } catch (err) {
        logger.error(`cannot remove board ${boardId}`, err)
        throw err
    }
}

async function addBoard(board) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)

        const newBoardTemplate = _getEmptyBoard(board.title, board.label, board.createdBy)
        const newBoard = {
            ...newBoardTemplate,
            ...board,
        }
        await collection.insertOne(newBoard)

        return newBoard
    } catch (err) {
        logger.error('cannot insert board', err)
        throw err
    }
}

async function updateBoard(board) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const { _id, ...boardToUpdate } = board

        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)

        await collection.updateOne({ _id: ObjectId.createFromHexString(board._id) }, { $set: boardToUpdate })

        await logActivity(board._id, loggedinUser._id, 'update', 'board', board._id)

        return board
    } catch (err) {
        logger.error(`cannot update board ${board._id}`, err)
        throw err
    }
}

async function addGroup(boardId, group) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
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

        await logActivity(boardId, loggedinUser._id, 'create', 'group', newGroup._id)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return newGroup
    } catch (err) {
        logger.error(`cannot add group to board ${boardId}`, err)
        throw err
    }
}

async function updateGroup(boardId, groupId, updatedGroup) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        const groupIdx = board.groups.findIndex((group) => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        board.groups[groupIdx] = { ...board.groups[groupIdx], ...updatedGroup }

        await logActivity(boardId, loggedinUser._id, 'update', 'group', groupId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return board.groups[groupIdx]
    } catch (err) {
        logger.error(`cannot update group in board ${boardId}`, err)
        throw err
    }
}

async function removeGroup(boardId, groupId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        const groupIdx = board.groups.findIndex((group) => group._id === groupId)
        if (groupIdx === -1) throw new Error('Group not found')

        const removedGroup = board.groups.splice(groupIdx, 1)

        await logActivity(boardId, loggedinUser._id, 'delete', 'group', groupId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return removedGroup
    } catch (err) {
        logger.error(`cannot remove group from board ${boardId}`, err)
        throw err
    }
}

async function addTask(boardId, groupId, task) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
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

        await logActivity(boardId, loggedinUser._id, 'create', 'task', newTask._id)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return newTask
    } catch (err) {
        logger.error(`cannot add task to group ${groupId} in board ${boardId}`, err)
        throw err
    }
}

async function updateTask(boardId, groupId, taskId, taskChanges) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        const group = board.groups.find((group) => group._id === groupId)
        if (!group) throw new Error('Group not found')

        const taskIdx = group.tasks.findIndex((task) => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')

        group.tasks[taskIdx] = { ...group.tasks[taskIdx], ...taskChanges }

        await logActivity(boardId, loggedinUser._id, 'update', 'task', taskId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return group.tasks[taskIdx]
    } catch (err) {
        logger.error(`cannot update task in group ${groupId} in board ${boardId}`, err)
        throw err
    }
}

async function removeTask(boardId, groupId, taskId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)
        const group = board.groups.find((group) => group._id === groupId)
        if (!group) throw new Error('Group not found')
        const taskIdx = group.tasks.findIndex((task) => task._id === taskId)
        if (taskIdx === -1) throw new Error('Task not found')
        const removedTask = group.tasks.splice(taskIdx, 1)

        await logActivity(boardId, loggedinUser._id, 'delete', 'task', taskId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return removedTask
    } catch (err) {
        logger.error(`cannot remove task from group ${groupId} in board ${boardId}`, err)
        throw err
    }
}

async function getComments(boardId, groupId, taskId) {
    try {
        const board = await getById(boardId)

        let item
        if (taskId) {
            const group = board.groups.find((group) => group._id === groupId)
            if (!group) throw new Error('Group not found')
            item = group.tasks.find((task) => task._id === taskId)
        } else if (groupId) {
            item = board.groups.find((group) => group._id === groupId)
        } else {
            item = board
        }

        if (!item) throw new Error('Item not found')
        return item.comments || []
    } catch (err) {
        logger.error(`Cannot get comments for item in board ${boardId}`, err)
        throw err
    }
}

async function addComment(boardId, groupId, taskId, comment) {
    const { loggedinUser } = asyncLocalStorage.getStore()

    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        let item
        if (taskId) {
            const group = board.groups.find((group) => group._id === groupId)
            if (!group) throw new Error('Group not found')
            item = group.tasks.find((task) => task._id === taskId)
        } else if (groupId) {
            item = board.groups.find((group) => group._id === groupId)
        } else {
            item = board
        }

        if (!item) throw new Error('Item not found')
        if (!item.comments) item.comments = []
        const newComment = {
            _id: makeId(),
            title: comment.title,
            createdAt: Date.now(),
            byMember: {
                _id: comment.byMember._id,
                fullname: comment.byMember.fullname,
                imgUrl: comment.byMember.imgUrl,
            },
        }

        item.comments.push(newComment)

        await logActivity(boardId, loggedinUser._id, 'create', 'comment', newComment._id)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })

        return newComment
    } catch (err) {
        logger.error(`Cannot add comment to item in board ${board._id}`, err)
        throw err
    }
}

async function deleteComment(boardId, groupId, taskId, commentId, userId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        let item
        if (taskId) {
            const group = board.groups.find((group) => group._id === groupId)
            if (!group) throw new Error('Group not found')
            item = group.tasks.find((task) => task._id === taskId)
        } else if (groupId) {
            item = board.groups.find((group) => group._id === groupId)
        } else {
            item = board
        }

        if (!item) throw new Error('Item not found')
        const commentIdx = item.comments.findIndex((comment) => comment._id === commentId)
        if (commentIdx === -1) throw new Error('Comment not found')
        if (item.comments[commentIdx].byMember._id !== userId) throw new Error('Not authorized to delete this comment')

        item.comments.splice(commentIdx, 1)

        await logActivity(boardId, loggedinUser._id, 'delete', 'comment', commentId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return commentId
    } catch (err) {
        logger.error(`Cannot delete comment from item in board ${boardId}`, err)
        throw err
    }
}

async function updateComment(boardId, groupId, taskId, commentId, updatedComment, userId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await getById(boardId)

        let item
        if (taskId) {
            const group = board.groups.find((group) => group._id === groupId)
            if (!group) throw new Error('Group not found')
            item = group.tasks.find((task) => task._id === taskId)
        } else if (groupId) {
            item = board.groups.find((group) => group._id === groupId)
        } else {
            item = board
        }

        if (!item) throw new Error('Item not found')
        const commentIdx = item.comments.findIndex((comment) => comment._id === commentId)
        if (commentIdx === -1) throw new Error('Comment not found')
        if (item.comments[commentIdx].byMember._id !== userId) throw new Error('Not authorized to update this comment')

        item.comments[commentIdx] = { ...item.comments[commentIdx], ...updatedComment }

        await logActivity(boardId, loggedinUser._id, 'update', 'comment', commentId)

        await collection.updateOne({ _id: ObjectId.createFromHexString(boardId) }, { $set: { groups: board.groups } })
        return item.comments[commentIdx]
    } catch (err) {
        logger.error(`Cannot update comment ${commentId} in item in board ${boardId}`, err)
        throw err
    }
}

async function logActivity(boardId, userId, action, entity, entityId) {
    const board = await Board.findById(boardId)
    if (board) {
        const activity = { userId, action, entity, entityId,  timestamp: new Date() }
        if (!board.activities) {
            board.activities = [];
        }
        board.activities.push(activity);

        // Find and log activity in the specific entity
        if (entity === 'group') {
            const group = board.groups.id(entityId)
            if (group) {
                if (!group.activities) {
                    group.activities = [];
                }
                group.activities.push(activity);
            }
            }
        } else if (entity === 'task') {
            board.groups.forEach((group) => {
                const task = group.tasks.id(entityId)
                if (task) {
                    if (!task.activities) {
                        task.activities = [];
                    }
                    task.activities.push(activity);
                }
            })
        } else if (entity === 'comment') {
            board.groups.forEach((group) => {
                group.tasks.forEach((task) => {
                    const comment = task.comments.id(entityId)
                    if (comment) {
                        if (!comment.activities) {
                            comment.activities = [];
                        }
                    }
                })
            })
        }

        await board.save()
    }


async function getBoardActivities(boardId) {
    try {
        const collection = await dbService.getCollection(BOARD_COLLECTION_NAME)
        const board = await collection.findOne({ _id: ObjectId.createFromHexString(boardId) }, { projection: { activities: 1 } })
        return board.activities
    } catch (err) {
        logger.error(`Cannot get activities for board ${boardId}`, err)
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

function _getEmptyGroup(title, style = {}, tasks = [], createdBy = []) {
    return {
        _id: makeId(),
        title,
        archivedAt: null,
        style,
        tasks,
        createdBy,
    }
}

function _getEmptyTask(title = 'New Task', createdBy = []) {
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
        createdBy,
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
