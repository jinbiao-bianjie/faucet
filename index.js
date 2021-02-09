const express  = require('express')
const gaiaSdk = require('gaia-sdk-js')
const irisSdk = require('irishub-sdk-js')
const {keyDAO} = require('./KeyDAO')
const http = require('http')
const app = express()
let cosmosAddressArr = [],irisAddressArr = []
app.all('*', function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	//Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	res.header('Access-Control-Allow-Methods', '*');
	res.header('Content-Type', 'application/json;charset=utf-8');
	next();
});
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
	if(req.query.network === 'cosmos'){
		cosmosAddressArr.unshift({
			address:req.query.address,
			networkName:req.query.network
		})
	}
	if(req.query.network === 'iris'){
		irisAddressArr.unshift({
			address:req.query.address,
			networkName:req.query.network
		})
	}
	
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
	mode:'async'
}
const irisBaseTx = {
	from: irisAddress,
	password:PASSWORD,
	mode:'async'
}

let cosmosTime = 0 ,irisTime = 0,cosmosFailedAddressArr = [],irisFailedAddressArr = []


setInterval(() => {
	if(cosmosAddressArr.length){
		if(cosmosTime === 0){
			sendCosmosToken(cosmosAddressArr[cosmosAddressArr.length - 1])
		}
	}
	if(irisAddressArr.length){
		if(irisTime === 0){
			sendIrisToken(irisAddressArr[irisAddressArr.length - 1])
		}
	}
},1000)

async function sendIrisToken(addressObj){
	irisTime++
	if(addressObj.networkName === 'iris'){
		await irisClient.bank.send(
			addressObj.address,
			[{
				denom:IRIS_DENOM,
				amount:IRIS_SEND_NUMBER
			}],
			irisBaseTx
		).then(res => {
			irisTime = 0
			
			if(res && res.hash){
				irisAddressArr.pop()
			}else {
				irisAddressArr.unshift(addressObj)
			}
		}).catch(e => {
			irisTime++
			if(irisTime < 4){
				sendIrisToken(addressObj)
			}else {
				irisFailedAddressArr.push({
					address:addressObj.address,
					err:JSON.stringify(e)
				})
				irisTime = 0
				console.log(irisFailedAddressArr,'iris send tx failed')
				
			}
		})
	}
}

async function sendCosmosToken (addressObj) {
	cosmosTime++
	if(addressObj.networkName === 'cosmos'){
		await cosmosClient.bank.send(
			addressObj.address,
			[{
				denom:COSMOS_DENOM,
				amount:COSMOS_SEND_NUMBER
			}],
			cosmosBaseTx
		).then(res => {
			cosmosTime = 0
			if(res && res.hash){
				cosmosAddressArr.pop()
			}else {
				cosmosAddressArr.unshift(addressObj)
			}
		}).catch(e => {
			cosmosTime++
			if(cosmosTime < 4){
				sendCosmosToken(addressObj)
			}else {
				cosmosFailedAddressArr.push({
					address:addressObj.address,
					err:JSON.stringify(e)
				})
				cosmosTime = 0
				console.log(cosmosFailedAddressArr,'cosmos send tx failed')
			}
		})
	}
	
}


app.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})

