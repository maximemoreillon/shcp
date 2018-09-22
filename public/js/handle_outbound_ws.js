function add_device_ws() {

  // Getting the elements
  // TODO: complete this
  var position_x_input = document.getElementById("position_x_input");
  var position_y_input = document.getElementById("position_y_input");

  // Construct JSON message
  var id = 'not_defined';
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].state = "not_defined";
  outbound_JSON_message[id].type = type_select.value;

  outbound_JSON_message[id].position = {};
  outbound_JSON_message[id].position.x = position_x_input.value;
  outbound_JSON_message[id].position.y = position_y_input.value;

  outbound_JSON_message[id].status_topic = status_topic_input.value;
  outbound_JSON_message[id].command_topic = command_topic_input.value;
  outbound_JSON_message[id].payload_on = payload_on_input.value;
  outbound_JSON_message[id].payload_off = payload_off_input.value;

  console.log("add_devices_in_back_end");
  socket.emit('add_devices_in_back_end', outbound_JSON_message);

  close_modal();
}

function edit_device_ws() {

  // Getting the elements
  // TODO: complete this
  var position_x_input = document.getElementById("position_x_input");
  var position_y_input = document.getElementById("position_y_input");
  var id_input = document.getElementById("id_input");

  var id = id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};
  outbound_JSON_message[id].type = type_select.value;
  outbound_JSON_message[id].status_topic = status_topic_input.value;
  outbound_JSON_message[id].command_topic = command_topic_input.value;
  outbound_JSON_message[id].payload_on = payload_on_input.value;
  outbound_JSON_message[id].payload_off = payload_off_input.value;

  console.log("edit_devices_in_back_end");
  socket.emit('edit_devices_in_back_end', outbound_JSON_message);

  close_modal();
}

function delete_device_ws() {

  var id_input = document.getElementById("id_input");

  var id = id_input.value;
  var outbound_JSON_message = {};
  outbound_JSON_message[id] = {};

  console.log("delete_devices_in_back_end");
  console.log(outbound_JSON_message);
  socket.emit('delete_devices_in_back_end', outbound_JSON_message);

  close_modal();

}
