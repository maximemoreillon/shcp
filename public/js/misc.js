var mode = "use";

function close_modal(){
  // Find more elegant way to do this
  // Basically close all modals except the disconnection modal
  document.getElementById('device_modal').style.display = "none";
  document.getElementById('new_device_image').style.display = "none";
  document.getElementById('camera_modal').style.display = "none";
  document.getElementById('sensor_info_modal').style.display = "none";

  // TODO: Find proper location for this
  socket.emit('stop_camera', 'nothing');

  restore_device_image();
}

function enable_edit_mode(){
  mode="edit";

  document.getElementById("toggle_edit_button").src= "images/icons/pencil_off.svg";

  // Make devices appear editable
  var devices_image = document.querySelectorAll(".device_image");
  devices_image.forEach(function(device_image) {
    device_image.classList.add("device_edit");
  });
}

function disable_edit_mode(){
  mode="use";

  document.getElementById("toggle_edit_button").src= "images/icons/pencil.svg";

  // Make devices appear not editable
  var devices_image = document.querySelectorAll(".device_image");
  devices_image.forEach(function(device_image) {
    device_image.classList.remove("device_edit");
  });
}

function toggle_edit_mode(){

  if(mode=="use"){
    enable_edit_mode()
  }
  else if(mode == "edit"){
    disable_edit_mode();
    close_modal();
  }
}

function toggle_device_state(id){
  // Sends WS message to toggle the device through MQTT
  // Create the payload
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].command_topic = devices[id].command_topic;

  // Just send the opposite state (it has been toggled)
  if(devices[id].state == devices[id].payload_on) {
    outbound_JSON_message[id].state = devices[id].payload_off;
  }
  else {
    outbound_JSON_message[id].state = devices[id].payload_on;
  }

  console.log('front_to_mqtt');
  socket.emit('front_to_mqtt', outbound_JSON_message);
}


window.onload = function(){
  // NOTE: SHOULD THIS BE HERE?
  // Open device modal if floorplan clicked while in edit mode

  var floorplan = document.getElementById('floorplan');

  floorplan.addEventListener('click',function(evt) {
    if(mode=="edit"){
      open_device_modal(evt);
    }
  });
}

function make_handler_for_onclick(id) {
  // Creates a handler for onclick events later
  // TODO: MAKE COMPACT

  return function() {

    if(mode == "use") {

      if( ["light","lock","fan","heater","switch"].includes(devices[id].type) ) {
        // FOR MQTT devices light lights, fans and locks
        toggle_device_state(id)
      }
      else if(["temperature","humidity","power","sensor"].includes(devices[id].type)){

        // Open up the device info modal
        var sensor_info_modal = document.getElementById("sensor_info_modal");
        var sensor_info = document.getElementById("sensor_info");
        sensor_info_modal.style.display = "flex";

        // For now just display raw data

        var state_json = JSON.parse(devices[id].state);
        var keys = Object.keys(state_json);

        sensor_info.innerHTML = "";
        if(keys.length > 0){
          keys.forEach(function(key){
            sensor_info.innerHTML += key;
            sensor_info.innerHTML += ": ";
            sensor_info.innerHTML += state_json[key];
            sensor_info.innerHTML += "<br>";
          });
        }
        else {
          sensor_info.innerHTML += state_json;
        }



      }

      else if(devices[id].type == "camera"){
        // Open up the camera modal
        var camera_modal = document.getElementById("camera_modal");
        camera_modal.style.display = "flex";
        socket.emit('start_camera', 'nothing');
      }

    }

    else if(mode == "edit") {

      // Get the inputs
      var id_input = document.getElementById('id_input');
      var type_select = document.getElementById("type_select");
      var floorplan = document.getElementById('floorplan');
      var device_modal = document.getElementById('device_modal');

      // don't show the new device since it's an edit of an existing one
      document.getElementById('new_device_image').style.display = "none";

      // Display the modal at the right position
      device_modal.style.display = "flex";
      device_modal.style.left = devices[id].position.x.toString() + "%";
      device_modal.style.top = devices[id].position.y.toString() + "%";

      // Fill the inputs
      // TODO: THOSE ARE NEVER DEFINED
      id_input.value = id;
      type_select.value = devices[id].type;

      // Specific inputs
      var specific_data_inputs = document.getElementById('device_modal').querySelectorAll(".specific_input");
      specific_data_inputs.forEach(function(input){
        input.value = devices[id][input.name];
      });

      // Manage buttons visibility
      add_button.style.display="none";
      delete_button.style.display="initial";
      submit_button.style.display="initial";

    }
  };
}

function get_mouse_pos_percent(element,evt) {
  // Gets the mouse position relative to element in percent

  var rect = element.getBoundingClientRect();

  return {
    x: (100.00*(evt.clientX - rect.left)/element.offsetWidth).toFixed(4),
    y: (100.00*(evt.clientY - rect.top)/element.offsetHeight).toFixed(4)
  };
}

function open_device_modal(evt) {
  // Meant for adding a device

  // Getting elements to work with
  var floorplan = document.getElementById('floorplan');
  var device_modal = document.getElementById('device_modal');
  var id_input = document.getElementById('id_input');
  var position_x_input = document.getElementById("position_x_input");
  var position_y_input = document.getElementById("position_y_input");
  var new_device_wrapper = document.getElementById("new_device");
  var new_device_image = document.getElementById("new_device_image");
  var type_select = document.getElementById("type_select");

  var mouse_pos = get_mouse_pos_percent(floorplan, evt);

  // Display the modal at the right location
  device_modal.style.display = "flex";
  device_modal.style.left = mouse_pos.x.toString() + "%";
  device_modal.style.top = mouse_pos.y.toString() + "%";

  // Fill the input fields
  id_input.value = "new_device";
  position_x_input.value = mouse_pos.x;
  position_y_input.value = mouse_pos.y;

  // clear the specific inputs
  var specific_data_inputs = document.getElementById('device_modal').querySelectorAll(".specific_input");
  specific_data_inputs.forEach(function(input){
    input.value = "";
  });


  // Display something where the device will be
  new_device_image.style.display = "block";
  new_device_image.style.left = mouse_pos.x.toString()+"%";
  new_device_image.style.top = mouse_pos.y.toString()+"%";
  new_device_image.src = "images/devices/new_device.svg";

  // Manage buttons visibility
  add_button.style.display="initial";
  delete_button.style.display="none";
  submit_button.style.display="none";

}

function restore_device_image() {

  // When edit is canceled, set the image back to what it was

  // BUG: Error when device deleted

  var device_id = id_input.value;

  if(device_id != "new_device" && device_id != '') {
    // Updates the new image when the select changes
    document.getElementById(device_id).src = get_device_image_src(devices[device_id]);
  }
}
