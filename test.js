const dip = require("dipiper");
function sleep(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function main() {
  dip.stock.symbols.getAreaList().then(data => {
    console.log(data);
  });
  await sleep(1000);
  process.exit(0);
}

main();