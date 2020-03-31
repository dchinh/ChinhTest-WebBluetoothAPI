## Welcome to GitHub Pages
Web Bluetooth APIを利用して、PCのChromeブラウザとRaspberry Piの間でBLE通信をしてみたいと思います。
### 
1. ラズベリー側
//blenoの読み込み、初期設定
var bleno = require("bleno");
var BlenoDescriptor = bleno.Descriptor;
var BlenoPrimaryService = bleno.PrimaryService;
//UUIDの設定
var RASPI_SERVICE_UUID 　　　　　　　= "d3025c12-c563-4c03-9b6d-cd6e946ec64c";
var RASPI_READ_CHARACTERISTIC_UUID = "def9da24-c8f5-4757-b66c-4464937a2698";
var RASPAI_DESC_UUID 　　　　　　= "f1800f89-1ff0-4ac4-8b84-b37415fa0a64";
 
//Characteristicの宣言
var EchoCharacteristic = function() {
  EchoCharacteristic.super_.call(this, {
    uuid: RASPI_READ_CHARACTERISTIC_UUID,　　//Characteristic用のUUIDの指定
    properties:["read", "write" ,"notify"], //このServiceに対して許可するリクエストの指定
    value:null,　　//Characteristicが保持する値の宣言
    descriptors: [
        new BlenoDescriptor({
            uuid: RASPAI_DESC_UUID, //Descriptor用のUUIDの指定
            value: "これは通信テスト用のメッセージデータです。"  //説明・追加情報の記載
        })
     ],
     onSubscribe: function(maxValueSize, updateValueCallback){
            console.log ('Notify接続');
           _updateValueCallback = updateValueCallback;
            },
            
    onUnsubscribe: function(){
            console.log ('Notify切断');
            _updateValueCallback = null;
            }
});
};
util.inherits(EchoCharacteristic, BlenoCharacteristic);
//
//セントラル側からReadリクエストを受けた時の処理
EchoCharacteristic.prototype.onReadRequest = function(offset, callback) {
  console.log("centralから readリクエストを受けました");
    this._value = new Buffer("hello, browser!"); 　//Characteristicに値を代入
  _Send = Buffer.from(Uint8Array.from(Buffer.from(this._value))).toString();
  console.log( '送信したメッセージ = ' + _Send);
  callback(this.RESULT_SUCCESS, this._value);
};
//セントラル側からWriteリクエストを受けた時の処理
EchoCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {　　
  console.log("centralからwriteリクエストを受けました");
    this._value = data;
  _Rcv = Buffer.from(Uint8Array.from(Buffer.from(this._value))).toString();
  console.log( '受け取ったメッセージ = ' + _Rcv);
  callback(this.RESULT_SUCCESS);
};
//Notify通知の準備ができた時の処理
EchoCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {  
  console.log('EchoCharacteristic – onSubscribe');
  this.updateCallback = updateValueCallback;
};
//Notify接続が切れたときの処理
EchoCharacteristic.prototype.onUnsubscribe = function() {
  console.log('EchoCharacteristic – onUnsubscribe');
  this.updateCallback = null;
};
 
module.exports = EchoCharacteristic;
 
console.log('bleno – echo');
 
bleno.on('stateChange', (state)=> {
  console.log('on -> stateChange: ' + state);
  if (state === 'poweredOn') {
    bleno.startAdvertising(name, [RASPI_SERVICE_UUID]);
  } else {
    bleno.stopAdvertising();
  }
});
 
bleno.on('advertisingStart', (error)=> {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success')); 
  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: RASPI_SERVICE_UUID,
        characteristics: [
          new EchoCharacteristic()
        ]
      })
    ]);
  }
});


2./PCのChromeブラウザ側
<!DOCTYPE html>
<html lang=ja>
<meta charset=UTF-8>
<script type='text/javascript'>
var bluetoothDevice;
var _oDevice;
var _oServer;
var _oService;
var _oCharaRead;
var _oCharaWrite;
var _descriptor;
var _oVal;
 
//const RASPI_SERVICE_UUID               = "d3025c12-c563-4c03-9b6d-cd6e946ec64c";
//const RASPI_READ_CHARACTERISTIC_UUID   = "def9da24-c8f5-4757-b66c-4464937a2698";
//const RASPAI_DESC_UUID				   = "f1800f89-1ff0-4ac4-8b84-b37415fa0a64";
console.log(navigator.bluetooth);
 
function connect() {　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　
	let options = {};
var RASPI_SERVICE_UUID               = document.getElementById("RASPI_SERVICE_UUID").value;
var RASPI_READ_CHARACTERISTIC_UUID   = document.getElementById("RASPI_READ_CHARACTERISTIC_UUID").value; 
var RASPAI_DESC_UUID				 = document.getElementById("RASPAI_DESC_UUID").value;
	options.filters = [
　//ここのコメントアウトを外すと周囲の全てのBLEデバイスをスキャンします。　
		//{acceptAllDevices:true}　
		{services: [RASPI_SERVICE_UUID]},
		{name: "raspberrypi"},
	];
//filterの条件で、周囲のBLEデバイスをスキャン
	navigator.bluetooth.requestDevice(options)
	  .then(device => {
	    console.log("device", device);
	    _oDevice = device;
//選択したデバイスと接続
	    return _oDevice.gatt.connect();　　　
	  })
	  .then(server => {
	    console.log("server", server);
	    _oServer = server;
	    return _oServer.getPrimaryService(RASPI_SERVICE_UUID);
	  })
　//選択したデバイスに設定されているServiceの情報を取得
	  .then(service => {
	    console.log("service", service);
	    _oService = service;
	    return _oService.getCharacteristic(RASPI_READ_CHARACTERISTIC_UUID);
	  })
//選択したServiceが保持しているCharacteristic情報を取得
	  .then(chara => {　
	    console.log("chara", chara);
	    _oCharaRead = chara;
//ペリフェラルからNotify通知を受け取る準備
	    chara.addEventListener("characteristicvaluechanged",onRecvSensorData);
            chara.startNotifications();
            alert("BLE端末との接続に成功しました");
            return _oCharaRead.getDescriptor(RASPAI_DESC_UUID);
	  })
	  .then(descriptor => {
            console.log("desc",descriptor);
            _descriptor = descriptor;
          })
	  .catch(error => {
	    console.log(error);
	  });
}
//ペリフェラル側のCharacteristicの値に書き込む処理
function writeMessage() {
	  var text = document.querySelector("#message").value;
	  var arrayBuffe = new TextEncoder().encode(text);
	  console.log(arrayBuffe);
	  var sendVal_log = new TextDecoder().decode(arrayBuffe);
	  console.log(sendVal_log);
	  var Send_element = document.getElementById("Send_text");
	  Send_element.innerHTML = sendVal_log;
	  _oCharaRead.writeValue(arrayBuffe);
}
//ペリフェラル側のCharacteristicの値にを読み込む処理
function readMessage() {　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　
    _oCharaRead.readValue()
	  .then(value => {
　　  　console.log("value", value.buffer);
　　　  _oVal = value;
	oVal = new TextDecoder("utf-8").decode(_oVal);
	var Rcv_element = document.getElementById("Rcv_text");
	Rcv_element.innerHTML = oVal;
	  })
	  .catch(error => {
	    console.log(error);
	  });
}
//ペリフェラル側のCharacteristicの値に追加されている説明情報を読み込む処理
function readDescriptor() {　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　
	_descriptor.readValue()
	  .then(value => {
	    _oVal = value;
	    oVal = new TextDecoder("utf-8").decode(_oVal);
	    var Desc_element = document.getElementById("Desc_text");
	    Desc_element.innerHTML = oVal;
	    console.log(oVal);
	  })
	  .catch(error => {
	    console.log(error);
	  });
}
//ペリフェラル側から送られてきたNotifyを受信する処理
function onRecvSensorData(event){                                 
	console.log("Notify受信");
	let characteristic = event.target; 
        let value = characteristic.value;
        var notifVal = new TextDecoder("utf-8").decode(value);
        var Rcv_element = document.getElementById("Rcv_text");
        Rcv_element.innerHTML = notifVal;    
}
//BEL切断処理
function disconnect() {
    _oDevice.gatt.disconnect();
	alert("BLE接続を切断しました。");
}
</script>

<title>Web Bluetooth API</title>
</head>
<body>
<p>PCラズパイ間 Web Bluetooth API通信テスト</p>
<p>RASPI_SERVICE_UUID:</p>
<input type="text" id="RASPI_SERVICE_UUID" value="d3025c12-c563-4c03-9b6d-cd6e946ec64c" size="35"/>
<p>RASPI_READ_CHARACTERISTIC_UUID: </p>
<input type="text" id="RASPI_READ_CHARACTERISTIC_UUID" value="def9da24-c8f5-4757-b66c-4464937a2698" size="35"/>
<p>RASPAI_DESC_UUID: </p>
<input type="text" id="RASPAI_DESC_UUID" value="f1800f89-1ff0-4ac4-8b84-b37415fa0a64" size="35"/> <br> <br>
<button id="connect" onclick="connect();">接続</button>
<button id="receive" onclick="readMessage();">受信</button>
<button id="descriptor" onclick="readDescriptor();">説明受信</button>
<input type="text" id="message" placeholder="送信するメッセージ" />
<button id="write" onclick="writeMessage();">送信</button>
<button id="disconnect" onclick="disconnect();">切断</button><br>
<p>受信したメッセージ : </p>
<p id="Rcv_text"></p><br>
<p>受信したメッセージの説明文 : </p>
<p id="Desc_text"></p><br>
<p>送信したメッセージ : </p>
<p id="Send_text"></p><br>
</body>
</html>
----------
https://ndchinh.com

