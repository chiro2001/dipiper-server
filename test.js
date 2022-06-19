const dip = require("dipiper");
const jsonRPC = require("json-rpc-2.0");
const fetch = require("node-fetch");
const JSONRPCClient = jsonRPC.JSONRPCClient;

function sleep(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function main() {
  // console.log(await dip.stock.symbols.getAreaList());

  // // JSONRPCClient needs to know how to send a JSON-RPC request.
  // // Tell it by passing a function to its constructor. The function must take a JSON-RPC request and send it.
  // const client = new JSONRPCClient((jsonRPCRequest) =>
  //   fetch("http://localhost:9090/jsonrpc", {
  //     method: "POST",
  //     headers: {
  //       "content-type": "application/json",
  //     },
  //     body: JSON.stringify(jsonRPCRequest),
  //   }).then((response) => {
  //     if (response.status === 200) {
  //       // Use client.receive when you received a JSON-RPC response.
  //       return response
  //         .json()
  //         .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
  //     } else if (jsonRPCRequest.id !== undefined) {
  //       return Promise.reject(new Error(response.statusText));
  //     }
  //   })
  // );

  // // Use client.request to make a JSON-RPC request call.
  // // The function returns a promise of the result.
  // client
  //   .request("echo", { text: "Hello, World!" })
  //   .then((result) => console.log(result));

  const data = await dip.stock.index.getMonthHis("BK0447");
  console.log(data);
  await sleep(1000);
  process.exit(0);
}

main();