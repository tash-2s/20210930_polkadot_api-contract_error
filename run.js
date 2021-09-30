const { readFileSync } = require("fs");
const { CodePromise } = require("@polkadot/api-contract");
const { WsProvider, ApiPromise } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");
const { cryptoWaitReady } = require("@polkadot/util-crypto");

const main = async () => {
  const api = await ApiPromise.create({
    provider: new WsProvider("ws://127.0.0.1:9944"),
  });

  await cryptoWaitReady();
  const pair = new Keyring({ ss58Format: 42, type: "sr25519" }).addFromUri(
    "//Alice"
  );

  const code = new CodePromise(
    api,
    readFileSync("./recursive/target/ink/recursive.contract", "utf8")
  );

  const contract = await new Promise(async (resolve, reject) => {
    const unsub = await code.tx
      .new(1_000_000_000n * 1_000_000n, 200_000n * 1_000_000n)
      .signAndSend(pair, (result) => {
        if (result.status.isInBlock) {
          unsub();
          if (result.findRecord("system", "ExtrinsicSuccess")) {
            console.log(
              `instantiation success: ${result.contract.address.toString()}`
            );
            resolve(result.contract);
            return;
          } else {
            reject("instantiation error");
            return;
          }
        }
      });
  });

  await new Promise(async (resolve, reject) => {
    const unsub = await contract.tx
      .set({ value: 0, gasLimit: -1 }, { B: "A" })
      .signAndSend(pair, (result) => {
        if (result.status.isInBlock) {
          unsub();
          if (result.findRecord("system", "ExtrinsicSuccess")) {
            console.log("tx success");
            resolve();
            return;
          } else {
            reject("tx error");
            return;
          }
        }
      });
  });

  const { result, output } = await contract.query.get(pair.address, {
    value: 0,
    gasLimit: -1,
  });
  if (result.isOk) {
    console.log(`query success: ${output.type} ${output.value.type}`);
  } else {
    throw new Error(`query error: ${result.asErr.toHuman()}`);
  }
};

main().catch(console.error).finally(process.exit);
