import fs from 'fs'
import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'


export const authService = {
	signup,
	login,
	getLoginToken,
	validateToken,
}
const cryptString = fs.readFileSync('config/crypt_key', 'utf8')
export const cryptr = new Cryptr(process.env.SECRET1 || cryptString)


async function login(email, password) {
	
	const user = await userService.getByEmail(email)

	if (!user) {
		return Promise.reject('Invalid email or password')
	}

	// TODO: un-comment for real login
	// const match = await bcrypt.compare(password, user.password)
	// if (!match) return Promise.reject('Invalid email or password')

	delete user.password
	user._id = user._id.toString()
	return user
}

async function signup({ password, fullname, imgUrl, email, isAdmin }) {

	const saltRounds = 10

	// logger.debug(`auth.service - signup with email: ${email}, fullname: ${fullname}`)
	if (!email || !password || !fullname) return Promise.reject('Missing required signup information')

	const userExist = await userService.getByEmail(email)
	if (userExist) return Promise.reject('email already exist')

	const hash = await bcrypt.hash(password, saltRounds)

	return userService.add({ email, password: hash, fullname, imgUrl, isAdmin })
}

function getLoginToken(user) {
	const userInfo = { 
        _id: user._id, 
		email: user.email,
        fullname: user.fullname, 
		imgUrl: user.imgUrl,
        isAdmin: user.isAdmin,
    }
	return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
	try {
		const json = cryptr.decrypt(loginToken)
		const loggedinUser = JSON.parse(json)
		return loggedinUser
	} catch (err) {
	}
	return null
}

