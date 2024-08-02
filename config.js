import dotenv from 'dotenv'
import { OPENAI_API_KEY } from './config/openai_key'
dotenv.config()
export const API_KEY = OPENAI_API_KEY
