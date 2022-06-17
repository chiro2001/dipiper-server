const dip = require("dipiper");

dip.stock.symbols.getStockList().then((data) => {
    //数据存储、处理逻辑，请自行实现
    console.log(data);
});