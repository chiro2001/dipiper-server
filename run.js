const logger = require('simple-node-logger').createSimpleLogger();
const dip = require("dipiper");
const MongoClient = require('mongodb').MongoClient;
const express = require("express");
const jsonRPC = require("json-rpc-2.0");
const fetch = require("node-fetch");
const JSONRPCClient = jsonRPC.JSONRPCClient;

const runPort = 8000;
const app = express();
// 访问 http://localhost:8000/api/v1/...
const apiPrefix = "/api/v1/";
var gdb = null;
// 安装 MogoDB 之后默认即可
const mongoURI = "mongodb://127.0.0.1/dipiper";

/**
 * 远程调用 Python 部分
 */
const client = new JSONRPCClient((jsonRPCRequest) =>
    fetch("http://localhost:9090/jsonrpc", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(jsonRPCRequest),
    }).then((response) => {
        if (response.status === 200) {
            // Use client.receive when you received a JSON-RPC response.
            return response
                .json()
                .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
        } else if (jsonRPCRequest.id !== undefined) {
            return Promise.reject(new Error(response.statusText));
        }
    })
);

function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

/**
 * API 回调默认说明文字
 */
const codeMessage = {
    200: "OK",
    500: "Internal Error"
};

/**
 * 将 data 包裹成标准返回格式
 * @param {*} data 
 * @param {*} code 
 * @param {*} message 
 * @returns 
 */
function wrap(data, code, message) {
    return {
        data,
        code: code || 200,
        message: message || codeMessage[code || 200]
    };
}


/**
 * 更新数据库中股票列表信息
 * @param {*} db 
 */
async function updateStockList(db) {
    const stockList = await dip.stock.symbols.getStockList();
    const col = db.collection("stockList");
    stockList.forEach(stockItem => {
        col.updateOne({ symbol: stockItem.symbol }, { $set: stockItem }, { upsert: true });
        logger.info("save stock item ", stockItem, " done");
    });
    console.log("updateStockList done.");
}

/**
 * 获取所有股票列表信息
 * @param {*} db 
 * @returns 
 */
async function getStockList(db) {
    const col = db.collection("stockList");
    const data = await col.find({}).toArray();
    // console.log(data);
    return data;
}

/**
 * 得到数据库接口
 * @returns MongoDB 数据库接口
 */
async function getDB() {
    return await new Promise((resolve, reject) => {
        MongoClient.connect(mongoURI, function (err, db) {
            if (err) throw err;
            console.log("Database init done!");
            resolve(db);
        });
    });
}

/**
 * 创建一个数组
 * @param {*} length 
 * @param {*} start 
 * @param {*} end 
 * @returns 
 */
const createArray = (length, start = 0, end = length) => Array.from({ length: end - start }, (_, i) => i + start);

/**
 * 获取数据库中缓存的 API 数据
 * @param {*} package 
 * @param {*} fun 
 * @param {*} args 
 * @returns 
 */
async function getCache(package, fun, args) {
    const col = gdb.collection("cache");
    const query = {
        package,
        "function": fun,
        args,
    };
    logger.info("cache query: ", query);
    const data = await col.findOne(query);
    return data;
}

async function setCache(package, fun, args, data) {
    const col = gdb.collection("cache");
    await col.insertOne({
        package,
        "function": fun,
        args,
        data,
    });
}

/**
 * 设置后端的路由
 */
function setupBackend() {
    // Json 中间件
    app.use(express.json());

    // 获取股票列表
    app.get(apiPrefix + "stockList", async (req, res) => {
        res.send(wrap(await getStockList(gdb)));
    });

    // 依据上传数据进行预测
    app.post(apiPrefix + "data_predict", async (req, res) => {
        const body = req.body;
        const data = body.data;
        const length = body.length;
        const x_data = createArray(length);
        const result = await client.request("train_and_predict", { dataset: data, x_data });
        res.send(wrap({
            result: result.data
        }));
    });

    // 获取某个股票的每月数据并且预测
    // :stock: 股票代码
    // query: 预测数据标号，见 http://dipiper.tech/gu-piao/zhi-shu-shu-ju.html#%E6%8C%87%E6%95%B0%E6%97%A5%E7%BA%BF%E6%95%B0%E6%8D%AE 的表格
    // body: { x_data: 需要进行预测的一段数据序列, model_type: 模型类型}
    //      x_data: [0, 2, 3, 4, ...] 长度任意
    //      model_type: lstm | bilstm | gru
    app.post(apiPrefix + "predict/:stock", async (req, res) => {
        const stock = req.params.stock;
        const query = req.query.query || "close";
        const body = req.body;
        logger.info("body: ", body);
        const dataRows = await dip.stock.index.getMonthHis(stock);
        const data = dataRows.map(row => {
            const col = row[query];
            const value = parseFloat(col);
            if (isNaN(value)) return col;
            return value;
        });
        try {
            const result = await client.request("train_and_predict", { dataset: data, ...body });
            res.send(wrap({
                dataRows,
                data,
                result
            }));
        } catch (e) {
            logger.error(e.toString());
            res.send(wrap(null, 500, e.toString()));
        }
    });

    app.get(apiPrefix + "income_analysis/:code", async (req, res) => {
        const code = req.params.code;
        // 获取三年的数据
        const year_count = 3;
        let years_data = [];
        const year_now = 2022;
        const col2 = gdb.collection("income_analysis");
        const col = gdb.collection("income_data");
        const last_ave = await col2.findOne({code, year_now});
        function parse_data(year_data) {
            if (year_data == undefined) return NaN;
            const income_str = (year_data.income != undefined) ? year_data.income.replaceAll(",", "") : "0.0";
            const income_value = +(income_str);
            return income_value;
        }
        if (last_ave && last_ave.ave != undefined) {
            let incomes = [];
            for (let i = 0; i < year_count; i++) {
                const year = year_now - i;
                const c = await col.findOne({year, code});
                const p = c && c.data && c.data.profit_statemet;
                // console.log("data", c, "p", p);
                incomes[i] = parse_data(p && p[0]);
            }
            res.send(wrap({
                incomes, ave: last_ave.ave
            }));
            return;
        }
        for (let i = 0; i < year_count; i++) {
            const year = year_now - i;
            const c = await col.findOne({year, code});
            if (c && c.data) {
                years_data[i] = c.data;
            } else {
                const data = await dip.stock.finance.getProfitStatment(code, "" + year, "general");
                // 存储数据到数据库
                col.insertOne({year, code, data});
                years_data[i] = data;
            }
        }
        // 分析三年数据
        let incomes = [];
        for (let i = 0; i < year_count; i++) {
            const p = years_data[i].profit_statemet;
            incomes[i] = parse_data(p && p[0]);
        }
        const ave = ((incomes[0] / incomes[1]) + (incomes[1] / incomes[2])) / 2;
        col2.insertOne({code, year_now, ave});
        res.send(wrap({incomes, ave}));
    });

    // 直接调用 dipiper API，例子：
    // dip.stock.finance.getGuideLine("000651", "2018") ->
    // http://localhost:8000/api/v1/finance/getGuideLine?a=000651&b=2018
    // URL 中 query 的参数表示调用的 dipiper API 中的函数参数顺序，可以是 a=..&b=.. 或者 a1=..&a2=..，符合字典序即可
    app.get(apiPrefix + ":package/:function", async (req, res) => {
        const params = req.params;
        const query = req.query;
        logger.info("params: ", params);
        logger.info("query: ", req.query);
        const queryKeys = Object.keys(query).sort();
        const args = queryKeys.map(key => query[key])
        const package = params['package'];
        const fun = params['function'];
        try {
            const cached = await getCache(package, fun, args);
            if (cached && cached.data) {
                logger.info("use cached data");
                res.send(wrap(cached.data));
                return;
            } else {
                logger.info("got invalid cached: ", cached);
            }
        } catch (e) {
            logger.error("cannot get cache: ", e);
        }
        try {
            logger.info("package ", package, " function ", fun, " args: ", args);
            const data = await dip.stock[package][fun](...args);
            // insert data into cache
            try {
                await setCache(package, fun, args, data);
            } catch (e) {
                logger.error("cannot set cache: ", e);
            }
            res.send(wrap(data));
        } catch (e) {
            console.error(e);
            res.send(wrap(null, 500, e.toString()));
        }
    });
}

/**
 * 启动后端服务监听
 */
async function launchBackend() {
    app.listen(runPort, () => {
        logger.info("Server launched at port ", runPort);
    });
}

/**
 * 主函数
 */
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
    // console.log(await getCache("trading", "getWeekHis", ["sz000725"]));
}

main();