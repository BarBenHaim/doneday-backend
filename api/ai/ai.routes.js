import { aiService } from './ai.service.js'
import express from 'express'
import '../../config.js'

export const aiRoutes = express.Router()
aiRoutes.post('/generateBoard', async (req, res) => {
    try {
        const board = await aiService.generateBoardFromDescription(req.body.description)
        res.status(200).json({ message: 'Board generated successfully', data: board })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Internal Server Error', error: err.message })
    }
})
