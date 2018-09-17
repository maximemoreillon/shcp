// Manages messages received through websocket
socket.on('indicator', function (data) {
  console.log('Websocket data arrived: ' + data.topic + ": " + data.payload);

  if(data.payload == "ON") {
    document.getElementById(data.topic).src = "images/light_on.svg";
  }
  else if (data.payload == "OFF") {
    document.getElementById(data.topic).src = "images/light_off.svg";
  }
});
