var _Send;
var _Rcv;
var _strData;
var _updateValueCallback;
var util = require('util');
var bleno = require('bleno');
var name = 'raspberrypi';
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;
var serviceUuids = [RASPI_SERVICE_UUID];
var BlenoPrimaryService = bleno.PrimaryService;

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
