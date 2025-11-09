export async function getAbstractReceipt(txHash, rpcUrl) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getTransactionReceipt",
    params: [txHash],
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error("Transaction not found");

  return json.result; // raw RPC result, no ethers decoding
}

export async function getAbstractTx(txHash, rpcUrl) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getTransactionByHash",
    params: [txHash],
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}
