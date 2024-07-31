export default {
    dbURL:
        process.env.MONGO_URL ||
        'mongodb+srv://barbenbh:96352414@doneday.taxyz0e.mongodb.net/?retryWrites=true&w=majority&appName=doneday',

    dbName: process.env.DB_NAME || 'doneday',
}
