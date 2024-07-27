import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getBoards, initDB,  getBoardById, addBoard, updateBoard, removeBoard, addBoardMsg, removeBoardMsg, addGroup, updateGroup, removeGroup, addTask, updateTask, removeTask } from './board.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, requireAuth, getBoards)
router.get('/initDB', initDB)
router.get('/:boardId', log,requireAuth,  getBoardById)
router.post('/', log, requireAuth, addBoard)
router.put('/:boardId', log, requireAuth, updateBoard)
router.delete('/:boardId', log, requireAuth, removeBoard)
// router.delete('/:id', requireAuth, requireAdmin, removeBoard)

router.post('/:boardId/msg', addBoardMsg)
router.delete('/:boardId/msg/:msgId', removeBoardMsg)

router.post('/:boardId/group', log, requireAuth, addGroup)
router.put('/:boardId/:groupId', log, requireAuth, updateGroup)
router.delete('/:boardId/:groupId',log, requireAuth, removeGroup)

router.post('/:boardId/:groupId/task', log, requireAuth, addTask)
router.put('/:boardId/:groupId/:taskId', log, requireAuth, updateTask)
router.delete('/:boardId/:groupId/:taskId',log, requireAuth, removeTask)

export const boardRoutes = router