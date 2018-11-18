// This file contains responses to socketio events

var socket = io();
var devices = {};

socket.on('connect', function() {
  console.log('WS connected');
  close_modal_by_ID('disconnected_modal');
});

socket.on('disconnect', function(){
  console.log('WS disconnected');
  open_modal_by_ID('disconnected_modal');
});

socket.on('create_all_devices', function (inbound_JSON_message) {
  console.log('create_all_devices');
  destroy_all_devices();
  create_devices_from_message(inbound_JSON_message);
});

socket.on('add_devices_in_front_end', function (inbound_JSON_message) {
  console.log('add_devices_in_front_end');
  create_devices_from_message(inbound_JSON_message);
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
    // TODO: Find way to deal with images
    var device_image = document.getElementById(id);
    device_image.src = get_device_image_src(devices[id]);
  }
});



// Some helpfer functions

function create_devices_from_message(inbound_JSON_message){

  // Get the floorplan wrapper to add images
  var floorplan_wrapper = document.getElementById("floorplan_wrapper");

  for(var id in inbound_JSON_message) {

    // Create the new device and get as many info from the JSON_messager as possible
    devices[id] = inbound_JSON_message[id];

    // Create the image
    var device_image = document.createElement('img');
    device_image.id = String(id); // Not optimal
    device_image.className = "device_image";
    device_image.src = get_device_image_src(devices[id]);
    device_image.style.left = String(devices[id].position.x) + "%";
    device_image.style.top = String(devices[id].position.y) + "%";
    device_image.onclick = make_handler_for_onclick(id);
    floorplan_wrapper.appendChild(device_image);
  }
}

function destroy_all_devices() {
  // remove all images
  for(var id in devices) {
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

  //destroy all devices
  devices = {};
}
