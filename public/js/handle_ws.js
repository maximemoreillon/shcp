var socket = io();
var devices = {};
var mode = "use";


function close_modals(){
  document.getElementById('add_device_modal').style.display = "none";
  document.getElementById('edit_device_modal').style.display = "none";
}

function toggle_edit_mode(button){
  if(mode=="use"){
    mode="edit";
    button.src = "images/icons/ok.svg";
  }
  else if(mode == "edit"){
    mode="use";
    button.src = "images/icons/edit.svg";

    close_modals();
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

// Creates a handler for onclick events later
function make_handler_for_onclick(id) {
  return function() {

    if(mode == "use") {

      var outbound_JSON_message = {};
      outbound_JSON_message[id] = {};

      if(devices[id].state == devices[id].payload_on) {
        outbound_JSON_message[id].state = devices[id].payload_off;
      }
      else {
        outbound_JSON_message[id].state = devices[id].payload_on;
      }
      socket.emit('front_to_mqtt', outbound_JSON_message);
    }
    else if(mode == "edit"){

      close_modals();

      var floorplan = document.getElementById('floorplan');
      var edit_device_modal = document.getElementById('edit_device_modal');

      // Fill the "form"
      edit_device_modal.style.display = "flex";
      edit_device_modal.style.left = devices[id].position_x.toString() + "%";
      edit_device_modal.style.top = devices[id].position_y.toString() + "%";
      edit_type_select.value = devices[id].type;
      edit_status_topic_input.value = devices[id].status_topic;
      edit_command_topic_input.value = devices[id].command_topic;
      edit_payload_on_input.value = devices[id].payload_on;
      edit_payload_off_input.value = devices[id].payload_off;

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



socket.on('add_devices', function (inbound_JSON_message) {
  console.log('Adding devices');

  // TODO: This function
});

socket.on('remove_devices', function (inbound_JSON_message) {
  console.log('Removing devices');

  // TODO: This function
});

socket.on('refresh_all_devices', function (inbound_JSON_message) {
  console.log('Refreshing all devices');

  // TODO: This function
});


socket.on('update_devices', function (inbound_JSON_message) {

  // Update any property of any device, add device if needed

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
      device_image.onclick = make_handler_for_onclick(id);
      device_wrapper.appendChild(device_image);
    }
    else {

      // This is the core of the function

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


window.onload = function(){

  var floorplan = document.getElementById('floorplan');

  floorplan.addEventListener('click',function(evt) {
    open_add_device_modal(evt);
  });
}

function get_mouse_pos_percent(element,evt) {
  var rect = element.getBoundingClientRect();
  return {
    x: (100.00*(evt.clientX - rect.left)/element.offsetWidth).toFixed(4),
    y: (100.00*(evt.clientY - rect.top)/element.offsetHeight).toFixed(4)
  };
}

function open_add_device_modal(evt) {

  close_modals();

  if(mode=="edit"){

    var floorplan = document.getElementById('floorplan');
    var add_device_modal = document.getElementById('add_device_modal');
    var mouse_pos = get_mouse_pos_percent(floorplan, evt);

    // Display something where the device will be
    /*
    new_device_wrapper.style.display = "block";
    new_device_wrapper.style.left = mouse_pos.x.toString()+"%";
    new_device_wrapper.style.top = mouse_pos.y.toString()+"%";
    */

    add_device_modal.style.display = "flex";
    add_device_modal.style.left = mouse_pos.x.toString() + "%";
    add_device_modal.style.top = mouse_pos.y.toString() + "%";

  }
}
