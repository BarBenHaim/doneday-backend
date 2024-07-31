export default {
    dbURL:
        process.env.MONGO_URL ||
        'mongodb+srv://BarBh:0526618184@cluster0-klgzh.mongodb.net/test?retryWrites=true&w=majority',
    dbName: process.env.DB_NAME || 'doneday',
}
