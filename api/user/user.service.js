import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export const userService = {
    add,
    getById, 
    update, 
    remove, 
    query, 
    getByEmail, 
    addActivity,
}

const USER_COLLECTION_NAME = 'user'

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        var users = await collection.find(criteria).toArray()
        users = users.map((user) => {
            delete user.password
            user.createdAt = user._id.getTimestamp()

            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getById(userId) {
    try {
        var criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        const user = await collection.findOne(criteria)

        delete user.password

        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function getByEmail(email) {
    try {
        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        const user = await collection.findOne({ email })
        return user
    } catch (err) {
        logger.error(`while finding user by email: ${email}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        await collection.deleteOne(criteria)
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    try {
        const userToSave = {
            _id: ObjectId.createFromHexString(user._id), 
            fullname: user.fullname,
            score: user.score,
        }
        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        const userToAdd = {
            email: user.email,
            password: user.password,
            fullname: user.fullname,
            imgUrl: user.imgUrl,
            isAdmin: user.isAdmin,
        }
        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                email: txtCriteria,
            },
            {
                fullname: txtCriteria,
            },
        ]
    }

    return criteria
}

async function addActivity(userId, activity) {
    try {
        const collection = await dbService.getCollection(USER_COLLECTION_NAME)
        await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $push: { activities: activity } })
    } catch (err) {
        logger.error(`Failed to add activity to user ${userId}`, err)
        throw err
    }
}
