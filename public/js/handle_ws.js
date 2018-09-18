var socket = io();
var devices = {};

function get_device_image_src(id){

  var device_image_src;

  // SHOULD PROBABLY CHECK IF THOS EXISTS

  switch (devices[id].type) {
    case "light":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/light_on.svg";
      }
      else {
        device_image_src = "images/devices/light_off.svg";
      }
      break;
    case "lock":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/lock_locked.svg";
      }
      else {
        device_image_src = "images/devices/lock_unlocked.svg";
      }
      break;
    case "climate":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/fan_on.svg";
      }
      else {
        device_image_src = "images/devices/fan_off.svg";
      }
      break;
    default:
      device_image_src = "images/devices/unknown.svg";
  }

  return device_image_src;
}

// Creates a handler for onclick events later
function make_handler(id) {
  return function() {
    var outbound_JSON_message = {};
    outbound_JSON_message[id] = {};

    if(devices[id].state == devices[id].payload_on) {
      outbound_JSON_message[id].state = devices[id].payload_off;
    }
    else {
      outbound_JSON_message[id].state = devices[id].payload_on;
    }
    socket.emit('update_back_end', outbound_JSON_message);
  };
}


socket.on('connect', function() {
  console.log('WS connected');
  document.getElementById('disconnected_modal').style.display = "none";
});


socket.on('disconnect', function(){
  console.log('WS disconnected');
  document.getElementById('disconnected_modal').style.display = "flex";
});


socket.on('update_devices', function (inbound_JSON_message) {

  console.log('Received an update for one or more devices');

  // Get the floorplan wrapper to add images
  var floorplan_wrapper = document.getElementById("floorplan_wrapper");

  // Update the device according to the all entries of the JSON_message
  for(var id in inbound_JSON_message) {
    // Check if the device actually exists. if not create it
    if (typeof devices[id] == 'undefined') {

      // Create the new device and get as many info from the JSON_messager as possible
      devices[id] = inbound_JSON_message[id];

      // Create the image
      var device_wrapper = document.createElement('div');
      device_wrapper.id = String(id); // Not optimal
      device_wrapper.className = "device_wrapper";
      device_wrapper.style.left = String(devices[id].position_x) + "%";
      device_wrapper.style.top = String(devices[id].position_y) + "%";
      floorplan_wrapper.appendChild(device_wrapper);

      var device_image = document.createElement('img');
      device_image.className = "device_image";
      device_image.src = get_device_image_src(id);
      device_image.onclick = make_handler(id);
      device_wrapper.appendChild(device_image);
    }
    else {
      // Update the members properties
      for(var property in inbound_JSON_message[id]) {

        // Check if the device has the given property
        devices[id][property] = inbound_JSON_message[id][property];

        // Set the image accordingly
        var device_wrapper = document.getElementById(String(id));
        var device_image = device_wrapper.getElementsByClassName("device_image")[0];
        device_image.src = get_device_image_src(id);
      }

    }


  }
});
