!function(e){var o={};function n(t){if(o[t])return o[t].exports;var l=o[t]={i:t,l:!1,exports:{}};return e[t].call(l.exports,l,l.exports,n),l.l=!0,l.exports}n.m=e,n.c=o,n.d=function(e,o,t){n.o(e,o)||Object.defineProperty(e,o,{enumerable:!0,get:t})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,o){if(1&o&&(e=n(e)),8&o)return e;if(4&o&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&o&&"string"!=typeof e)for(var l in e)n.d(t,l,function(o){return e[o]}.bind(null,l));return t},n.n=function(e){var o=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(o,"a",o),o},n.o=function(e,o){return Object.prototype.hasOwnProperty.call(e,o)},n.p="",n(n.s=0)}([function(e,o){console.log("Client source hit");var n,t,l=0,r={value:"mnr6qkd369f00000"};document.getElementById("testButton").onclick=(()=>t.send("test"));var c=document.getElementById("setHostId");document.getElementById("submitHostId").onclick=(()=>{r.value=c.value,(n=new Peer("",{host:location.hostname,port:location.port||("https:"===location.protocol?443:80),path:"/peerjs",debug:3})).on("open",function(e){null===n.id?(console.log("Received null id from peer open"),n.id=l):l=n.id,console.log("ID: "+n.id)}),n.on("disconnected",function(){console.log("Connection lost. Please reconnect"),n.id=l,n._lastServerId=l,n.reconnect()}),n.on("close",function(){t=null,console.log("Connection destroyed")}),n.on("error",function(e){console.log(e),alert(""+e)}),function(){t&&t.close();(t=n.connect(r.value,{reliable:!0})).on("open",function(){console.log("Connected to: "+t.peer),t.send("test")}),t.on("data",function(e){console.log(e)}),t.on("close",function(){console.log("Connection closed")})}()})}]);