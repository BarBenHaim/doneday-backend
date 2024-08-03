import { logger } from '../services/logger.service.js'

export async function log(req, res, next) {
    const { baseUrl, method, body, params } = req
    const logEntry = { baseUrl, method, params }
	logger.info(JSON.stringify(logEntry, null, 2))
	next()
}
