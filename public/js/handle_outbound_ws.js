function add_device_ws() {

  // Getting the elements
  // TODO: complete this
  var add_position_x_input = document.getElementById("add_position_x_input");
  var add_position_y_input = document.getElementById("add_position_y_input");

  // Construct JSON message
  var id = 'not_defined';
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].state = "not_defined";
  outbound_JSON_message[id].type = add_type_select.value;
  outbound_JSON_message[id].position_x = add_position_x_input.value;
  outbound_JSON_message[id].position_y = add_position_y_input.value;
  outbound_JSON_message[id].status_topic = add_status_topic_input.value;
  outbound_JSON_message[id].command_topic = add_command_topic_input.value;
  outbound_JSON_message[id].payload_on = add_payload_on_input.value;
  outbound_JSON_message[id].payload_off = add_payload_off_input.value;

  console.log("add_devices_in_back_end");
  socket.emit('add_devices_in_back_end', outbound_JSON_message);

  close_modals();
}

function edit_device_ws() {

  // Getting the elements
  // TODO: complete this
  var add_position_x_input = document.getElementById("add_position_x_input");
  var add_position_y_input = document.getElementById("add_position_y_input");
  var edit_id_input = document.getElementById("edit_id_input");
  
  var id = edit_id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].type = edit_type_select.value;
  outbound_JSON_message[id].status_topic = edit_status_topic_input.value;
  outbound_JSON_message[id].command_topic = edit_command_topic_input.value;
  outbound_JSON_message[id].payload_on = edit_payload_on_input.value;
  outbound_JSON_message[id].payload_off = edit_payload_off_input.value;

  console.log("edit_devices_in_back_end");
  socket.emit('edit_devices_in_back_end', outbound_JSON_message);

  close_modals();
}

function delete_device_ws() {

  var edit_id_input = document.getElementById("edit_id_input");

  var id = edit_id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};

  console.log("delete_devices_in_back_end");
  socket.emit('delete_devices_in_back_end', outbound_JSON_message);

  close_modals();

}
