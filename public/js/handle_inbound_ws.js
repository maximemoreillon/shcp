var socket = io();
var devices = {};
var mode = "use";


function close_modal(){
  document.getElementById('device_modal').style.display = "none";
  document.getElementById('new_device').style.display = "none";
  restore_device_image();
}

function toggle_edit_mode(button){
  if(mode=="use"){
    mode="edit";
    button.src = "images/icons/ok.svg";
  }
  else if(mode == "edit"){
    mode="use";
    button.src = "images/icons/edit.svg";
    close_modal();
  }
}

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

function get_device_image_src_by_type(type){

  var device_image_src;

  switch (type) {
    case "light":
      device_image_src = "images/devices/light_off.svg";
      break;
    case "lock":
      device_image_src = "images/devices/lock_locked.svg";
      break;
    case "climate":
      device_image_src = "images/devices/fan_off.svg";
      break;
    default:
      device_image_src = "images/devices/unknown.svg";
  }
  return device_image_src;
}

// When floorplan clicked while in edit mode, add device
window.onload = function(){

  var floorplan = document.getElementById('floorplan');

  floorplan.addEventListener('click',function(evt) {
    open_device_modal(evt);
  });
}

// Creates a handler for onclick events later
function make_handler_for_onclick(id) {
  return function() {

    if(mode == "use") {

      // TODO: Only send relevant info

      // Create the payload
      var outbound_JSON_message = {};
      outbound_JSON_message[id] = {};
      outbound_JSON_message[id].command_topic = devices[id].command_topic;

      // Just send the opposite state (been toggled)
      if(devices[id].state == devices[id].payload_on) {
        outbound_JSON_message[id].state = devices[id].payload_off;
      }
      else {
        outbound_JSON_message[id].state = devices[id].payload_on;
      }
      socket.emit('front_to_mqtt', outbound_JSON_message);
    }
    else if(mode == "edit") {

      // don't show the new device since it's an edit of an existing one
      document.getElementById('new_device').style.display = "none";

      var floorplan = document.getElementById('floorplan');
      var device_modal = document.getElementById('device_modal');

      // Display the modal
      device_modal.style.display = "flex";
      device_modal.style.left = devices[id].position_x.toString() + "%";
      device_modal.style.top = devices[id].position_y.toString() + "%";

      // Fill the "form"
      // TODO: THOSE ARE NEVER DEFINED
      id_input.value = id;
      type_select.value = devices[id].type;
      status_topic_input.value = devices[id].status_topic;
      command_topic_input.value = devices[id].command_topic;
      payload_on_input.value = devices[id].payload_on;
      payload_off_input.value = devices[id].payload_off;

      // Manage buttons visibility
      add_button.style.display="none";
      delete_button.style.display="initial";
      submit_button.style.display="initial";

    }
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
      // TODO:  Check if the device has the given property
      devices[id][property] = inbound_JSON_message[id][property];
    }

    // Set the image accordingly
    var device_wrapper = document.getElementById(id);
    var device_image = device_wrapper.getElementsByClassName("device_image")[0];
    device_image.src = get_device_image_src(id);
  }

});

socket.on('create_all_devices', function (inbound_JSON_message) {

  console.log('create_all_devices');
  // Update any property of any device, add device if needed

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
    device_image.src = get_device_image_src(id);
    device_image.onclick = make_handler_for_onclick(id);
    device_wrapper.appendChild(device_image);
  }
});





function get_mouse_pos_percent(element,evt) {
  var rect = element.getBoundingClientRect();
  return {
    x: (100.00*(evt.clientX - rect.left)/element.offsetWidth).toFixed(4),
    y: (100.00*(evt.clientY - rect.top)/element.offsetHeight).toFixed(4)
  };
}

function open_device_modal(evt) {

  if(mode=="edit"){

    // Getting elements to work with
    var floorplan = document.getElementById('floorplan');
    var device_modal = document.getElementById('device_modal');
    var position_x_input = document.getElementById("position_x_input");
    var position_y_input = document.getElementById("position_y_input");
    var new_device = document.getElementById("new_device");
    var new_device_image = document.getElementById("new_device_image");
    var type_select = document.getElementById("type_select");

    var mouse_pos = get_mouse_pos_percent(floorplan, evt);

    // Display the modal at the right location
    device_modal.style.display = "flex";
    device_modal.style.left = mouse_pos.x.toString() + "%";
    device_modal.style.top = mouse_pos.y.toString() + "%";

    // Fill the input fields
    position_x_input.value = mouse_pos.x;
    position_y_input.value = mouse_pos.y;

    id_input.value = "new_device";

    // Clear the other input fields
    type_select.value="light";
    status_topic_input.value = "";
    command_topic_input.value = "";
    payload_on_input.value = "";
    payload_off_input.value = "";


    // Manage buttons visibility
    add_button.style.display="initial";
    delete_button.style.display="none";
    submit_button.style.display="none";

    // Display something where the device will be
    new_device.style.display = "block";
    new_device.style.left = mouse_pos.x.toString()+"%";
    new_device.style.top = mouse_pos.y.toString()+"%";

    new_device_image.src=get_device_image_src_by_type(type_select.value);

  }
}

function restore_device_image() {
  var device_id = id_input.value;

  if(device_id != "new_device") {
    // Updates the new image when the select changes
    var device = document.getElementById(device_id);
    var device_image = device.getElementsByClassName("device_image")[0];

    // BUG will set the image to off!
    device_image.src = get_device_image_src(device_id);
  }
}


function update_device_image(select) {

  var device_id = id_input.value;

  // Updates the new image when the select changes
  var device = document.getElementById(device_id);
  var device_image = device.getElementsByClassName("device_image")[0];
  device_image.src = get_device_image_src_by_type(select.value);


}
