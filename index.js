const express  = require('express')
const gaiaSdk = require('gaia-sdk-js')
const irisSdk = require('irishub-sdk-js')
const {keyDAO} = require('./KeyDAO')
const http = require('http')
const app = express()
const dotenv = require('dotenv');
dotenv.config();
let addressArr = []
const {
	COSMOS_NODE,
	IRIS_NODE,
	COSMOS_CHAIN_ID,
	IRIS_CHAIN_ID,
	COSMOS_GAS,
	IRIS_GAS,
	COSMOS_FEE_AMOUNT,
	COSMOS_DENOM,
	IRIS_FEE_AMOUNT,
	IRIS_DENOM,
	PASSWORD,
	COSMOS_SEND_NUMBER,
	IRIS_SEND_NUMBER,
	COSMOS_MNEMONIC_WORD,
	IRIS_MNEMONIC_WORD
} = process.env

app.get('/api/faucet',(req,res)=>{
	addressArr.unshift({
		address:req.query.address,
		networkName:req.query.network
	})
	res.send({
		code:0,
		message:'summit success'
	})
})
const cosmosConfigClient = {
	node : COSMOS_NODE,
	network : 0,
	chainId : COSMOS_CHAIN_ID,
	gas : COSMOS_GAS,
	fee : { amount: COSMOS_FEE_AMOUNT, denom: COSMOS_DENOM },
	keyDAO:keyDAO,
	rpcConfig : { timeout: 15000 },
}
const irisConfigClient = {
	node : IRIS_NODE,
	network : 0,
	chainId : IRIS_CHAIN_ID,
	gas : IRIS_GAS,
	fee : { amount: IRIS_FEE_AMOUNT, denom: IRIS_DENOM },
	keyDAO:keyDAO,
	rpcConfig : { timeout: 15000 },
}
const cosmosClient = gaiaSdk.newClient(cosmosConfigClient).withKeyDAO(keyDAO)
const irisClient = irisSdk.newClient(irisConfigClient).withKeyDAO(keyDAO)
const cosmosAddress = cosmosClient.keys.recover('cosmosKey',PASSWORD,COSMOS_MNEMONIC_WORD)
const irisAddress = irisClient.keys.recover('irisKey',PASSWORD,IRIS_MNEMONIC_WORD)
const cosmosBaseTx = {
	from: cosmosAddress,
	password:PASSWORD,
}
const irisBaseTx = {
	from: irisAddress,
	password:PASSWORD,
}
let time = 0

setInterval(() => {
	if(addressArr.length){
		if(time === 0){
			sentBanlance(addressArr[addressArr.length - 1])
		}
	}
},1000)

async function sentBanlance (addressObj) {
	console.log(addressObj)
	if(addressObj.networkName === 'cosmos'){
		await cosmosClient.bank.send(
			addressObj.address,
			[{
				denom:COSMOS_DENOM,
				amount:COSMOS_SEND_NUMBER
			}],
			cosmosBaseTx
		).then(res => {
			if(res.hash){
				addressArr.pop()
			}else {
				time++
				if(time < 3){
					sentBanlance(addressObj.address)
				}else {
					time = 0
				}
			}
		}).catch(e => {
			console.log(e,'cosmos send tx failed')
			
		})
	}else {
		await irisClient.bank.send(
			addressObj.address,
			[{
				denom:IRIS_DENOM,
				amount:IRIS_SEND_NUMBER
			}],
			irisBaseTx
		).then(res => {
			if(res.hash){
				addressArr.pop()
			}else {
				time++
				if(time < 3){
					sentBanlance(addressObj.address)
				}else {
					time = 0
				}
			}
		}).catch(e => {
			console.log(e,'iris send tx failed')
		})
	}
	
}


app.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})
