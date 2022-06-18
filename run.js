const logger = require('simple-node-logger').createSimpleLogger();
const dip = require("dipiper");
const MongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb://localhost:27017/dipiper";


async function updateStockList(db) {
    const stockList = await dip.stock.symbols.getStockList();
    const col = db.collection("stockList");
    stockList.forEach(stockItem => {
        col.updateOne({ symbol: stockItem.symbol }, { $set: stockItem }, { upsert: true });
        logger.info("got", stockItem, "done");
    });
    console.log("updateStockList done.");
}

async function getDB() {
    return await new Promise((resolve, reject) => {
        MongoClient.connect(mongoURI, function (err, db) {
            if (err) throw err;
            console.log("数据库已创建!");
            resolve(db);
        });
    });
}

async function main() {
    const database = await getDB();
    const db = database.db("dipiper");
    await updateStockList(db);
}

main();