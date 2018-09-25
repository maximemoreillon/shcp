function add_device_ws() {

  // Getting the elements
  var position_x_input = document.getElementById("position_x_input");
  var position_y_input = document.getElementById("position_y_input");
  var type_select = document.getElementById("type_select");
  var id_input = document.getElementById("id_input");

  // Construct JSON message
  // The ID is given later by the DB
  var id = id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};

  outbound_JSON_message[id].type = type_select.value;
  outbound_JSON_message[id].position = {};
  outbound_JSON_message[id].position.x = position_x_input.value;
  outbound_JSON_message[id].position.y = position_y_input.value;

  // Send all the specific data
  var specific_data_inputs = document.getElementById('device_modal').querySelectorAll(".specific_input");
  specific_data_inputs.forEach(function(input){
    outbound_JSON_message[id][input.name] = input.value;
  });

  console.log("add_devices_in_back_end");
  socket.emit('add_devices_in_back_end', outbound_JSON_message);

  disable_edit_mode();
  close_modal();
}

function edit_device_ws() {

  // Getting the elements
  var position_x_input = document.getElementById("position_x_input");
  var position_y_input = document.getElementById("position_y_input");
  var type_select = document.getElementById("type_select");
  var id_input = document.getElementById("id_input");

  // Send the common data
  var id = id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].type = type_select.value;

  // Send all the specific data
  var specific_data_inputs = document.getElementById('device_modal').querySelectorAll(".specific_input");
  specific_data_inputs.forEach(function(input){
    outbound_JSON_message[id][input.name] = input.value;
  });

  console.log("edit_devices_in_back_end");
  socket.emit('edit_devices_in_back_end', outbound_JSON_message);

  disable_edit_mode();
  close_modal();
}

function delete_device_ws() {

  var id_input = document.getElementById("id_input");

  var id = id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};

  console.log("delete_devices_in_back_end");
  socket.emit('delete_devices_in_back_end', outbound_JSON_message);

  disable_edit_mode();
  close_modal();
}
