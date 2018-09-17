var socket = io();
var devices;

socket.on('connect', function() {
  console.log('WS connected');
  document.getElementById('disconnected_modal').style.display = "none";
});


socket.on('disconnect', function(){
  console.log('WS disconnected');
  document.getElementById('disconnected_modal').style.display = "flex";
});




socket.on('get_all_devices', function (devices_from_ws) {
  // Manages messages received through websocket

  devices = devices_from_ws;

  console.log('Received list of all devices');

  var floorplan_wrapper = document.getElementById("floorplan_wrapper");

  for(var id in devices) {

    var device_wrapper = document.createElement('div');
    device_wrapper.className = "device_wrapper";
    device_wrapper.style.left = String(devices[id].position_x) + "%";
    device_wrapper.style.top = String(devices[id].position_y) + "%";
    floorplan_wrapper.appendChild(device_wrapper);

    var device_image = document.createElement('img');
    device_image.className = "device_image";

    // device image: EXTERNALIZE THIS FUNCTION IF POSSIBLE
    switch (devices[id].type) {
      case "light":
        if(devices[id].state == devices[id].payload_on) device_image.src = "images/light_on.svg";
        else device_image.src = "images/light_off.svg";
        break;
      case "lock":
        if(devices[id].state == devices[id].payload_on) device_image.src = "images/lock.svg";
        else device_image.src = "images/lock.svg";
        break;
      case "climate":
        if(devices[id].state == devices[id].payload_on) device_image.src = "images/ac.svg";
        else device_image.src = "images/ac.svg";
        break;
      default:
        if(devices[id].state == devices[id].payload_on) device_image.src = "images/question-mark.svg";
        else device_image.src = "images/question-mark.svg";
    }

    // Attach onclick PROBLEM HERE

    device_image.onclick = function(){

      var JSON_message = {};
      JSON_message[id] = {};

      if(devices[id].state == devices[id].payload_on) {
        JSON_message[id].state = devices[id].payload_off;
      }
      else {
        JSON_message[id].state = devices[id].payload_on;
      }
      socket.emit('update_back_end',JSON_message);
    };


    device_wrapper.appendChild(device_image);

  }

});
