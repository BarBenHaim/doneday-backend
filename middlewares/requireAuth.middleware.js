import { config } from '../config/index.js'
import { logger } from '../services/logger.service.js'
import { asyncLocalStorage } from '../services/als.service.js'
import { authService } from '../api/auth/auth.service.js'

export async function requireAuth(req, res, next) {
    try {
        const { loggedinUser } = asyncLocalStorage.getStore()
        req.loggedinUser = loggedinUser

        if (config.isGuestMode && !loggedinUser) {
            const user = await authService.login('barbenbh@gmail.com', '123456')
            req.loggedinUser = user
            const loginToken = authService.getLoginToken(user)
            res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
            return next()
        } else if (!loggedinUser) return res.status(401).send('Not Authenticated')
        next()
    } catch (err) {
        console.log(err)
        logger.error('Failed to authenticate user', err)
        res.status(401).send('Not Auth')
    }
}

export function requireAdmin(req, res, next) {
    const { loggedinUser } = asyncLocalStorage.getStore()

    if (!loggedinUser) return res.status(401).send('Not Authenticated')
    if (!loggedinUser.isAdmin) {
        logger.warn(loggedinUser.fullname + 'attempted to perform admin action')
        res.status(403).end('Not Authorized')
        return
    }
    next()
}
