import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import {
    getBoards,
    initDB,
    getBoardById,
    addBoard,
    updateBoard,
    removeBoard,
    addGroup,
    updateGroup,
    removeGroup,
    addTask,
    updateTask,
    removeTask,
    addComment,
    deleteComment,
    getComments,
    updateComment,
    getBoardActivities,
} from './board.controller.js'

const router = express.Router()
router.get('/', log, requireAuth, getBoards)
router.get('/initDB', initDB)
router.get('/:boardId', log, requireAuth, getBoardById)
router.post('/', log, requireAuth, addBoard)
router.put('/:boardId', log, requireAuth, updateBoard)
router.delete('/:boardId', log, requireAuth, removeBoard)

router.post('/:boardId/group', log, requireAuth, addGroup)
router.put('/:boardId/:groupId', log, requireAuth, updateGroup)
router.delete('/:boardId/:groupId', log, requireAuth, removeGroup)

router.post('/:boardId/:groupId/task', log, requireAuth, addTask)
router.put('/:boardId/:groupId/:taskId', log, requireAuth, updateTask)
router.delete('/:boardId/:groupId/:taskId', log, requireAuth, removeTask)

router.post('/:boardId/:groupId/:taskId/comment', log, requireAuth, addComment)
router.put('/:boardId/:groupId/:taskId/:commentId', log, requireAuth, updateComment)
router.delete('/:boardId/:groupId/:taskId/:commentId', log, requireAuth, deleteComment)
router.get('/:boardId/:groupId/:taskId/comment', log, requireAuth, getComments)

router.get('/:boardId/activities', log, requireAuth, getBoardActivities)

export const boardRoutes = router
