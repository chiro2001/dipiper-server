const logger = require('simple-node-logger').createSimpleLogger();
const dip = require("dipiper");
const MongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb://localhost:27017/dipiper";
const express = require("express");

const runPort = 8000;
const app = express();
const apiPrefix = "/api/v1/";
var gdb = null;


function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

const codeMessage = {
    200: "OK",
    500: "Internal Error"
};

function wrap(data, code, message) {
    return {
        data,
        code: code || 200,
        message: message || codeMessage[code || 200]
    };
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
    const col = db.collection("stockList");
    const data = await col.find({}).toArray();
    console.log(data);
    return data;
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

function setupBackend() {
    // Json 中间件
    app.use(express.json());

    // 获取股票列表
    app.get(apiPrefix + "stockList", async (req, res) => {
        res.send(wrap(await getStockList(gdb)));
    });

    // 直接调用 API
    app.get(apiPrefix + ":package/:function", async (req, res) => {
        const params = req.params;
        const query = req.query;
        logger.info("params: ", params);
        logger.info("query: ", req.query);
        const queryKeys = Object.keys(query).sort();
        const args = queryKeys.map(key => query[key])
        try {
            logger.info("package ", dip.stock[params['package']], " function ", dip.stock[params['package']][params['function']], " args: ", args);
            const data = await dip.stock[params['package']][params['function']](...args);
            dip.stock.symbols.getAreaList().then(data => {
                console.log(data);
            });
            logger.info("data: ", data);
            res.send(wrap(data));
        } catch (e) {
            console.error(e);
            res.send(wrap(null, 500, e.toString()));
        }
    });
}

async function launchBackend() {
    app.listen(runPort, () => {
        logger.info("Server launched at port ", runPort);
    });
}

async function main() {
    const database = await getDB();
    const db = database.db("dipiper");
    gdb = db;
    setupBackend();
    launchBackend();
    let stockCount = await db.collection("stockList").countDocuments();
    if (stockCount < 3000) await updateStockList(db);
    stockCount = await db.collection("stockList").countDocuments();
    logger.info("stock count: ", stockCount);
    // await sleep(1000);
    // process.exit(0);
}

main();