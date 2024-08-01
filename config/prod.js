export default {
    dbURL:
        process.env.MONGO_URL ||
        'mongodb+srv://melnikovariella:Pe1CQUX96BxCTMnJ@cluster0.bivubcy.mongodb.net/',

    dbName: process.env.DB_NAME || 'doneday',
}
