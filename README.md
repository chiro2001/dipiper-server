# dipiper-test

## 安装依赖

推荐安装 NodeJS 16 版本。

```shell
npm install
```

## 运行

### 运行服务器

运行前请开启 Python 服务器。

```shell
npm run dev
```

### 运行测试

```shell
npm run test
```

## 用例

1. 获取数据库中所有股票列表

   ```
   GET http://localhost:8000/api/v1/stockList
   ```

   示例返回

   ```json
   {
       "data": [
           {
               "_id": "62ad90b871481a7eca8558cd",
               "symbol": "bj430047",
               "code": "430047",
               "name": "诺思兰德"
           },
           ...
           {
               "_id": "62ad919071481a7eca8577bc",
               "symbol": "sz300065",
               "code": "300065",
               "name": "海兰信"
           }
       ],
       "code": 200,
       "message": "OK"
   }
   
   ```

2. 调用 dipiper API

   需要调用 `dip.stock.finance.getGuideLine("000651", "2018")` 

   ```
   GET http://localhost:8000/api/v1/finance/getGuideLine?a=000651&b=2018
   ```

   URL 中 query 的参数表示调用的 dipiper API 中的函数参数顺序，可以是 `a=..&b=..` 或者 `a1=..&a2=..`，符合字典序即可。

   示例返回

   ```json
   {
       "data": {
           "share_index": [
               {
                   "date": "2018-12-31",
                   "Diluted_EPS": "4.385",
                   "EPSWA": "4.36",
                   "AEPS": "4.36",
                   "EPS_NGOL": "4.25",
                   "BPS": "15.412",
                   "BPS_Adjusted": "15.1814",
                   "OCFPS": "4.4784",
                   "CRPS": "0.0155",
                   "UDPPS": "13.6209"
               },
               ...
               ],
           "profitability": [
               {
                   "Date": "2018-12-31",
                   "OROA": "10.4998",
                   "OPE": "29.349",
                   "PROA": "11.3166",
                   "ROPTC": "19.2697",
                   "OPR": "15.6453",
                   "COGSTS": "69.7718",
                   "PMOS": "13.3145",
                   "DOE": "641.6138",
                   "ROC": "41.6307",
                   "ROA": "15.3633",
                   "SGPR": "30.2282",
                   "POTE": "11.2643",
                   "NMP": "1.2259",
                   "POMP": "185.9309",
                   "RR": "0",
                   "ROI": "--",
                   "GP": "58147116642.14",
                   "ROE": "28.69",
                   "ROEWA": "33.36",
                   "NPAD": "25580865501.38"
               },
       		...
       ],
           "growth_ability": [
               {
                   "Date": "2018-12-31",
                   "MBRG": "33.6084",
                   "NPGR": "17.1953",
                   "GRNA": "38.7222",
                   "GRTA": "16.8705"
               },
               ...
           ],
           "operation_ability": [
               {
                   "Date": "2018-12-31",
                   "ART": "29.3208",
                   "DSO": "12.278",
                   "DSI": "47.6323",
                   "RST": "7.5579",
                   "TFA": "11.0424",
                   "TATO": "0.8499",
                   "TATD": "423.5792",
                   "CATA": "1.0673",
                   "DCAT": "337.2997"
               },
   			...
           ],
           "debt_decapital_structure": [
               {
                   "Date": "2018-12-31",
                   "AR": "1.2665",
                   "QR": "1.1396",
                   "CR": "71.7115",
                   "ICR": "-3198.1925",
                   "LDWCR": "0",
                   "EAR": "36.9037",
                   "LDR": "0",
                   "REFA": "504.0825",
                   "DER": "170.9755",
                   "RLALF": "55.5718",
                   "MCR": "0",
                   "FANWR": "60.0845",
                   "CIR": "55.5718",
                   "ER": "170.0767",
                   "LVR": "156.0249",
                   "POFA": "7.321",
                   "LEV": "63.0963",
                   "ASSET": "251234157276.81"
               },
               ...
           ],
           "cash_flow": [
               {
                   "Date": "2018-12-31",
                   "NOCFTSR": "0.136",
                   "ROOCFOA": "0.1072",
                   "NOCFTNP": "1.0213",
                   "NOCFTDR": "0.17",
                   "CFR": "17.0851"
               },
   			...
           ]
       },
       "code": 200,
       "message": "OK"
   }
               
   ```

3. 获取某个股票的每月数据并且预测

   示例：获取并预测 `BK0447` 的每月开盘数据

   ```
   GET http://localhost:8000/api/v1/predict/BK0447?query=open
   ```

   ```
   	// :stock: 股票代码
       // query: 预测数据标号，见 http://dipiper.tech/gu-piao/zhi-shu-shu-ju.html#%E6%8C%87%E6%95%B0%E6%97%A5%E7%BA%BF%E6%95%B0%E6%8D%AE 的表格
       // body: { x_data: 需要进行预测的一段数据序列, model_type: 模型类型}
       //      x_data: [0, 2, 3, 4, ...] 长度任意
       //      model_type: lstm | bilstm | gru
   ```

   示例 Body

   ```json
   {
       "x_data": [0, 1, 2],
       "model_type": "lstm"
   }
   ```

   示例返回

   ```
   {
       "data": {
       	// 每月历史数据
           "dataRows": [
               {
                   "date": "2000-01-28",
                   "open": "1005.53",
                   "close": "1318.44",
                   "high": "1356.71",
                   "low": "998.18",
                   "volume": "10531623",
                   "amount": "27551166000.00",
                   "swing": "35.85"
               },
               ...
           ],
           // 每月历史数据中的指定 query 项
           "data": [
               1318.44,
               1578.04,
           	...
           ],
           // 预测结果，因为只发送了 3 个数字所以返回 3 个数字
           // 注意一下是列表的嵌套
           "result": {
               "data": [
                   [
                       0.030032450333237648
                   ],
                   [
                       1.0331597328186035
                   ],
                   [
                       1.8556859493255615
                   ]
               ]
           }
       },
       "code": 200,
       "message": "OK"
   }
   ```

   发送的 Body 的意思：

   训练并且预测这一数据在经过 Body 中一段数据变化之后会怎么变化