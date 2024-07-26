import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getBoards, initDB,  getBoardById, addBoard, updateBoard, removeBoard, addBoardMsg, removeBoardMsg, addTask, updateTask, removeTask } from './board.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getBoards)
router.get('/initDB', initDB)
router.get('/:boardId', log, getBoardById)
router.post('/', log, addBoard)
router.put('/:boardId', updateBoard)
router.delete('/:boardId', removeBoard)
// router.delete('/:id', requireAuth, requireAdmin, removeBoard)

router.post('/:boardId/msg', addBoardMsg)
router.delete('/:boardId/msg/:msgId', removeBoardMsg)

router.post('/:boardid/:groupId/task', log, addTask)
router.put('/:boardId/:groupId/:taskId', log, updateTask)
router.delete('/:boardId/:groupId/:taskId',log, removeTask)

export const boardRoutes = router