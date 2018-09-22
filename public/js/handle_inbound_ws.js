var socket = io();
var devices = {};


socket.on('connect', function() {
  console.log('WS connected');
  document.getElementById('disconnected_modal').style.display = "none";
});


socket.on('disconnect', function(){
  console.log('WS disconnected');
  document.getElementById('disconnected_modal').style.display = "flex";
});


socket.on('add_devices_in_front_end', function (inbound_JSON_message) {
  console.log('add_devices_in_front_end');

  for(var id in inbound_JSON_message) {
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
    device_image.onclick = make_handler_for_onclick(id);
    device_wrapper.appendChild(device_image);
  }
});

socket.on('delete_devices_in_front_end', function (inbound_JSON_message) {
  console.log('delete_devices_in_front_end');

  for(var id in inbound_JSON_message) {

    delete devices[id];

    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

});


socket.on('edit_devices_in_front_end', function (inbound_JSON_message) {
  // edit the device according to the all entries of the JSON_message

  console.log('edit_devices_in_front_end');

  for(var id in inbound_JSON_message) {
    // edit the device's properties
    for(var property in inbound_JSON_message[id]) {
      devices[id][property] = inbound_JSON_message[id][property];
    }

    // Set the image accordingly
    var device_wrapper = document.getElementById(id);
    var device_image = device_wrapper.getElementsByClassName("device_image")[0];
    device_image.src = get_device_image_src(id);
  }

});

socket.on('create_all_devices', function (inbound_JSON_message) {

  // Create all devices

  console.log('create_all_devices');

  // Destroy all devices
  devices = {};

  // Get the floorplan wrapper to add images
  var floorplan_wrapper = document.getElementById("floorplan_wrapper");

  // Update the device according to the all entries of the JSON_message
  for(var id in inbound_JSON_message) {
    // Check if the device actually exists. if not create it

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
    device_image.src = devices_icons[devices[id].type][devices[id].state];
    device_image.onclick = make_handler_for_onclick(id);
    device_wrapper.appendChild(device_image);
  }
});
