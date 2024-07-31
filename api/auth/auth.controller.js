import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'
import { readJsonFile } from '../../services/util.service.js'

export async function login(req, res) {
    try {
        const credentials = req.body

        if (!('email' in credentials) || !('password' in credentials)) {
            return Promise.reject('No email or password in credentials')
        }
        const user = await authService.login(credentials.email, credentials.password)
        const loginToken = authService.getLoginToken(user)
        res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
        res.json(user)
    } catch (err) {
        logger.error('Failed to Login ' + err)
        res.status(401).send({ err: 'Failed to Login' })
    }
}

export async function signup(req, res) {
    try {
        const credentials = req.body

        // Never log passwords
        const account = await authService.signup(credentials)
        logger.debug(`auth.route - new account created: ` + JSON.stringify(account))

        const user = await authService.login(credentials.email, credentials.password)
        logger.info('User signup:', user)

        const loginToken = authService.getLoginToken(user)
        res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
        res.json(user)
    } catch (err) {
        logger.error('Failed to signup ' + err)
        res.status(400).send({ err: 'Failed to signup' })
    }
}

export async function logout(req, res) {
    try {
        res.clearCookie('loginToken')
        res.send({ msg: 'Logged out successfully' })
    } catch (err) {
        res.status(400).send({ err: 'Failed to logout' })
    }
}

export async function initUserDB(req, res) {
    try {
        const user = readJsonFile('api/data/users.json')
        let usersToSignup = [...user]
        var usersAdded = 0

        await usersToSignup.map(user => {
            try {
                delete user._id
                authService.signup(user)
                usersAdded += 1
            } catch (err) {
                logger.error('Failed to add user', err)
            }
        })

        res.send(`${usersAdded} users added to db`)
    } catch (err) {
        logger.error('Failed to init users DB', err)
        res.status(500).send({ err: 'Failed to init DB' })
    }
}
