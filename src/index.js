require('dotenv').config();
const Web3 = require("web3");
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common');
const contractAbi = require('./ERC20.json').abi;
const readline = require('readline');
const fs = require("fs");

const common = Common.default.forCustomChain('mainnet', {
    name: 'bnb',
    networkId: 56,
    chainId: 56,
}, 'istanbul');

const web3 = new Web3("https://bsc-dataseed.binance.org");
const contractAddress = "0x4556A6f454f15C4cD57167a62bdA65A6be325D1F"; // FAM token
const myContract = new web3.eth.Contract(contractAbi, contractAddress);

const sender = process.env.SENDER;
const private = process.env.KEY;

async function send(toAddress, amount) {
    const txCount = await web3.eth.getTransactionCount(sender)
    var privateKey = Buffer.from(private, 'hex')
    var txObject = {};
    txObject.nonce = web3.utils.toHex(txCount);
    txObject.gasLimit = web3.utils.toHex(900000);
    txObject.gasPrice = web3.utils.toHex(web3.utils.toWei("10", "gwei"));
    txObject.to = contractAddress;
    txObject.value = '0x';

    // Calling transfer function of contract and encode it in AB format
    txObject.data = myContract.methods.transfer(toAddress, web3.utils.toHex(
        web3.utils.toWei(amount.toString(), "ether"))).encodeABI();

    //Sign transaction before sending
    var tx = new Tx(txObject, { common });
    tx.sign(privateKey);
    var serializedTx = tx.serialize();
    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
}

async function sendAll() {
    const readInterface = readline.createInterface({
        input: fs.createReadStream("sendlist.txt"),
        console: false
    });
    for await (const line of readInterface) {
        const parts = line.split(" ");
        const address = parts[0];
        const amount = parseInt(parts[1]);
        if (web3.utils.isAddress(address)) {
            await send(address, amount)
                .then(() => console.log(`Sent ${amount} to ${address} ok`))
                .catch(err => console.error(`Sent ${amount} to ${address} error: ${err}`))
        } else {
            console.error(`Invalid address: ${address}`);
        }
    }
}

sendAll();
