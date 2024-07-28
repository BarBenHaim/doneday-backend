import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { addComment, deleteComment, getCommentss } from './comments.controller.js'

const router = express.Router()

router.get('/', log, getCommentss)
router.post('/',  log, requireAuth, addComment)
router.delete('/:id',  requireAuth, deleteComment)

export const CommentRoutes = router