import express from 'express'

import { login, signup, logout, initUserDB } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.get('/initUserDB', initUserDB)


export const authRoutes = router