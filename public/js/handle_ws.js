var socket = io();

socket.on('connect', function() {
  console.log('WS connected');
  document.getElementById('disconnected_modal').style.display = "none";
});


socket.on('disconnect', function(){
  console.log('WS disconnected');
  document.getElementById('disconnected_modal').style.display = "flex";
});




socket.on('indicator', function (data) {
  // Manages messages received through websocket
  
  console.log('Websocket data arrived: ' + data.topic + ": " + data.payload);



  /*
  if(data.payload == "ON") {
    document.getElementById(data.topic).src = "images/light_on.svg";
  }
  else if (data.payload == "OFF") {
    document.getElementById(data.topic).src = "images/light_off.svg";
  }

  */



});
