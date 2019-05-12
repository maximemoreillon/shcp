
var mode = "use";

var socket = io();

// respond to websocket events
socket.on('connect', function() {
  console.log("[WS] connect");
  close_modal_by_ID('disconnected_modal');
});

socket.on('disconnect', function(){
  console.log("[WS] disconnect");
  open_modal_by_ID('disconnected_modal');
});

socket.on('delete_and_create_all_in_front_end', function (device_array) {
  console.log("[WS] delete_and_create_all_in_front_end");
  delete_all_devices_in_front_end();
  add_or_update_some_devices_in_front_end(device_array);
});

socket.on('add_or_update_some_in_front_end', function (device_array) {
  console.log("[WS] add_or_update_some_in_front_end");
  add_or_update_some_devices_in_front_end(device_array);
});

socket.on('delete_some_in_front_end', function (device_array) {
  console.log("[WS] delete_some_in_front_end");
  delete_some_devices_in_front_end(device_array);
});

function make_handler_for_onclick(device) {
  // Creates a handler for onclick events
  return function() {
    // either edit or usual onclick event
    if(mode == "use") {
      for(var index in devices_template){
        if(device.type === devices_template[index].type){
          devices_template[index].onclick(device);
        }
      }
    }
    else if(mode == "edit") {

      // don't show the new device since it's an edit of an existing one
      document.getElementById('new_device').style.display = "none";

      // Display the modal at the right position
      var device_modal = document.getElementById('device_modal');
      device_modal.style.display = "flex";
      device_modal.style.left = "5%"; //device.position.x.toString() + "%";
      device_modal.style.top = device.position.y.toString() + "%";

      // Fill the inputs
      document.getElementById('id_input').value = device._id;
      document.getElementById("type_select").value = device.type;
      document.getElementById('position_x_input').value = device.position.x;
      document.getElementById('position_y_input').value = device.position.y;

      create_specific_inputs();
      populate_specific_inputs(device);

      // Manage buttons visibility
      add_button.style.display="none";
      delete_button.style.display="initial";
      submit_button.style.display="initial";
    }
  };
}

function delete_all_devices_in_front_end() {
  // delete all devices
  var devices = document.getElementsByClassName("device");
  for(var device_index=0; device_index<devices.length;device_index++){
    devices[device_index].parentNode.removeChild(devices[device_index]);
  }
}

function create_device_in_front_end(device_data){
  // Get the floorplan wrapper to add images
  var floorplan_wrapper = document.getElementById("floorplan_wrapper");

  // Create the image
  var device = document.createElement('SPAN');
  device.id = device_data._id;
  floorplan_wrapper.appendChild(device);
}

function update_device_in_front_end(device_data){

  var device = document.getElementById(device_data._id);

  // copy properties
  for(var property_index in device_data){
    device[property_index] = device_data[property_index];
  }

  // Device image
  device.className = "device mdi mdi-help-circle-outline";

  for(var index=0; index < devices_template.length; index++){
    if(device.type === devices_template[index].type){
      device.classList.remove("mdi-help-circle-outline");
      device.classList.add(devices_template[index].icon);
    }
  }

  // Set color depending on state using class
  if(typeof device.state !== 'undefined'){
    if(device.state === device.payload_on){
      device.classList.add("on");
    }
  }

  device.style.left = String(device.position.x) + "%";
  device.style.top = String(device.position.y) + "%";

  device.onclick = make_handler_for_onclick(device);

}

function add_or_update_some_devices_in_front_end(device_array){

  for(var index=0; index < device_array.length; index ++){
    // Check if device already exists
    var device = document.getElementById(device_array[index]._id);
    if(device === null){
      // The device does not exist so create it
      create_device_in_front_end(device_array[index]);
    }
    update_device_in_front_end(device_array[index]);
  }
}

function delete_some_devices_in_front_end(device_array){
  // inbound_JSON_message is an array
  for(var index=0; index < device_array.length; index ++){
    // Check if device already exists
    var device = document.getElementById(device_array[index]._id);
    if(device !== null){
      // If the device exists, delete it
      device.parentNode.removeChild(device);
    }
  }
}

function get_device_properties_from_inputs(){
  var device = {};

  device.position = {};
  device.position.x = document.getElementById('position_x_input').value;
  device.position.y = document.getElementById('position_y_input').value;
  device._id = document.getElementById('id_input').value;
  device.type = document.getElementById('type_select').value;

  var specific_device_property_inputs = document.getElementById('specific_properties_inputs_container').querySelectorAll(".specific_device_property_input");
  for(var input_index = 0; input_index<specific_device_property_inputs.length; input_index++){
    device[specific_device_property_inputs[input_index].name] = specific_device_property_inputs[input_index].value;
  }

  return device;
}


function add_device_in_back_end() {
  console.log("[WS] add_one_device_in_back_end");
  var device = get_device_properties_from_inputs();
  socket.emit('add_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}

function edit_device_in_back_end() {
  console.log("[WS] edit_one_device_in_back_end");
  var device = get_device_properties_from_inputs();
  socket.emit('edit_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}

function delete_device_in_back_end() {
  console.log("[WS] delete_one_device_in_back_end");
  var device = get_device_properties_from_inputs();
  socket.emit('delete_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}

function close_all_modals(){
  // Find more elegant way to do this
  // Basically close all modals except the disconnection modal
  document.getElementById('device_modal').style.display = "none";
  document.getElementById('new_device').style.display = "none";
}

function enable_edit_mode(){
  mode="edit";

  // change the edit icon
  document.getElementById("toggle_edit_button").src= "images/icons/pencil_off.svg";

  // Make devices appear editable
  var devices = document.querySelectorAll(".device");
  for(var device_index=0; device_index<devices.length; device_index++){
    devices[device_index].classList.add("device_edit");
  }
}

function disable_edit_mode(){
  mode="use";

  document.getElementById("toggle_edit_button").src= "images/icons/pencil.svg";

  // Make devices appear not editable
  var devices = document.querySelectorAll(".device");
  for(var device_index=0; device_index<devices.length; device_index++){
    devices[device_index].classList.remove("device_edit");
  }

}

function toggle_edit_mode(){

  if(mode=="use"){
    enable_edit_mode()
  }
  else if(mode == "edit"){
    disable_edit_mode();
    close_all_modals();
  }
}


function get_mouse_pos_percent(element,evt) {
  // Gets the mouse position relative to element in percent

  var rect = element.getBoundingClientRect();

  var position_pixels = {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  }

  var granularity = 4;

  var position_percent_granular = {
    x: 100.00*position_pixels.x/element.offsetWidth,
    y: 100.00*position_pixels.y/element.offsetHeight,
  }

  return position_percent_granular;
}

function open_device_modal(evt) {
  // Meant for adding a device

  // Getting elements to work with
  var floorplan = document.getElementById('floorplan');
  var device_modal = document.getElementById('device_modal');
  var new_device = document.getElementById("new_device");

  var mouse_pos = get_mouse_pos_percent(floorplan, evt);

  // Display the modal at the right location
  device_modal.style.display = "flex";
  device_modal.style.left = "5%"; //mouse_pos.x.toString() + "%";
  device_modal.style.top = mouse_pos.y.toString() + "%";

  // Fill the input fields
  document.getElementById('id_input').value = "new_device";
  document.getElementById("type_select").value = "";
  create_specific_inputs();

  document.getElementById("position_x_input").value = mouse_pos.x;
  document.getElementById("position_y_input").value = mouse_pos.y;

  // Display something where the device will be
  new_device.style.display = "flex";
  new_device.style.left = mouse_pos.x.toString()+"%";
  new_device.style.top = mouse_pos.y.toString()+"%";

  // Manage buttons visibility
  add_button.style.display="initial";
  delete_button.style.display="none";
  submit_button.style.display="none";

}


function create_specific_inputs(){

  // create specific input fields in the device edit/create modal depending on the device type
  var type_select = document.getElementById("type_select");
  var specific_data_inputs = document.getElementById("specific_properties_inputs_container");

  // Clear first
  specific_data_inputs.innerHTML = "";

  for(var index=0; index<devices_template.length; index++){

    // check if there is ma match in the templates list
    if(type_select.value === devices_template[index].type){

      // if so, create each input fields and corresponding labels
      for(var field_index=0; field_index<devices_template[index].form_fields.length; field_index++){

        var container = document.createElement("DIV");
        var input = document.createElement("INPUT");
        var label = document.createElement("LABEL");

        input.type = "text";
        input.name = devices_template[index].form_fields[field_index].field_name;
        input.className = "specific_device_property_input";

        label.for = devices_template[index].form_fields[field_index].field_name;
        label.innerHTML = devices_template[index].form_fields[field_index].field_label;

        specific_data_inputs.appendChild(container);
        container.appendChild(label);
        container.appendChild(input);
      }
    }
  }
}

function populate_specific_inputs(device){
  var specific_device_property_inputs = document.getElementById('specific_properties_inputs_container').querySelectorAll(".specific_device_property_input");
  for(var input_index = 0; input_index<specific_device_property_inputs.length; input_index++){
    field_name = specific_device_property_inputs[input_index].name;
    if(typeof device[field_name] !== 'null'){
      specific_device_property_inputs[input_index].value = device[field_name];
    }
  }
}



// This code is executed after the page has been loaded
window.onload = function(){

  // Open device modal if floorplan clicked while in edit mode in order to create new device
  // THIS MIGHT NOT BE THE RIGHT WAY TO DO IT
  document.getElementById('floorplan').addEventListener('click',function(evt) {
    if(mode=="edit"){
      open_device_modal(evt);
    }
  });

  // fill the type selector
  var type_select = document.getElementById("type_select");

  for(var device_index=0; device_index<devices_template.length; device_index++){
    var option = document.createElement("OPTION");
    option.value = devices_template[device_index].type;
    option.innerHTML = devices_template[device_index].type;
    type_select.appendChild(option);
  }
}
