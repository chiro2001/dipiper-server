const logger = require('simple-node-logger').createSimpleLogger();
const dip = require("dipiper");
const MongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb://localhost:27017/dipiper";


function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}


async function updateStockList(db) {
    const stockList = await dip.stock.symbols.getStockList();
    const col = db.collection("stockList");
    stockList.forEach(stockItem => {
        col.updateOne({ symbol: stockItem.symbol }, { $set: stockItem }, { upsert: true });
        logger.info("save stock item ", stockItem, " done");
    });
    console.log("updateStockList done.");
}

async function getStockList(db) {

}

async function getDB() {
    return await new Promise((resolve, reject) => {
        MongoClient.connect(mongoURI, function (err, db) {
            if (err) throw err;
            console.log("Database init done!");
            resolve(db);
        });
    });
}

async function main() {
    const database = await getDB();
    const db = database.db("dipiper");
    logger.info("hi");
    let stockCount = await db.collection("stockList").countDocuments();
    if (stockCount < 3000) await updateStockList(db);
    stockCount = await db.collection("stockList").countDocuments();
    logger.info("stock count: ", stockCount);
    await sleep(1000);
    process.exit(0);
}

main();