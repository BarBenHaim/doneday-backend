import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { userService } from '../user/user.service.js'
import { authService } from '../auth/auth.service.js'
import { commentsService } from './comments.service.js'
import { boardService } from '../board/board.service.js'

export async function getCommentss(req, res) {
    try {
        const comments = await commentsService.query(req.query)
        res.send(comments)
    } catch (err) {
        logger.error('Cannot get comments', err)
        res.status(400).send({ err: 'Failed to get comments' })
    }
}

export async function deleteComment(req, res) {
    var { loggedinUser } = req
    const { id: commentId } = req.params

    try {
        const deletedCount = await commentsService.remove(commentId)
        if (deletedCount === 1) {
            // Send an emit to all users but the sender about a comment removed
            socketService.broadcast({ type: 'comment-removed', data: commentId, userId: loggedinUser._id })
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove comment' })
        }
    } catch (err) {
        logger.error('Failed to delete comment', err)
        res.status(400).send({ err: 'Failed to delete comment' })
    }
}

export async function addComment(req, res) {
    var { loggedinUser } = req

    try {
        var comment = req.body
        const { aboutUserId } = comment
        comment.byUserId = loggedinUser._id
        comment = await commentsService.add(comment)

        await userService.update(loggedinUser)

        // Update user score in login token as well
        const loginToken = authService.getLoginToken(loggedinUser)
        res.cookie('loginToken', loginToken)

        // prepare the updated comment for sending out

        comment.byUser = loggedinUser
        comment.aboutId = await boardService.getById(aboutId)
        comment.createdAt = comment._id.getTimestamp()

        delete comment.aboutId
        delete comment.byUserId

        // Send an emit to all users but the sender about a review added
        socketService.broadcast({ type: 'comment-added', data: comment, userId: loggedinUser._id })
        // Emit a msg to the user the review is written about
        socketService.emitToUser({ type: 'comment-about-you', data: comment, userId: comment.aboutId._id })

        // Emit an updated user to everyone watching his profile
        const fullUser = await userService.getById(loggedinUser._id)
        socketService.emitTo({ type: 'user-updated', data: fullUser, label: fullUser._id })

        res.send(comment)
    } catch (err) {
        logger.error('Failed to add review', err)
        res.status(400).send({ err: 'Failed to add review' })
    }
}
