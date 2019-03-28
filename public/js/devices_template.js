var devices_template = [
  {
    type: "light",
    form_fields: [
      {field_name: "command_topic", field_label:"Command topic"},
      {field_name: "status_topic", field_label:"Status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icon: "mdi-lightbulb",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "heater",
    form_fields: [
      {field_name: "command_topic", field_label:"Command topic"},
      {field_name: "status_topic", field_label:"Status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icon: "mdi-radiator",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "fan",
    form_fields: [
      {field_name: "command_topic", field_label:"Command topic"},
      {field_name: "status_topic", field_label:"Status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icon: "mdi-fan",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "sensor",
    form_fields: [
      {field_name: "status_topic", field_label:"Status topic"}
    ],
    icon: "mdi-gauge",
    onclick: function(device){open_sensor_modal(device)}
  },
  {
    type: "camera",
    form_fields: [
      {field_name: "stream_url", field_label:"Stream URL"}
    ],
    icon: "mdi-cctv",
    onclick: function(device){open_camera_modal(device)}
  },

]



// Actions to clicks on device

function toggle_device_state(device){
  // Sends WS message to toggle the device through MQTT
  // Create the payload
  var outbound_JSON_message = {};
  outbound_JSON_message[device._id] = {};
  outbound_JSON_message[device._id].command_topic = device.command_topic;

  // Just send the opposite state (it has been toggled)
  if(device.state == device.payload_on) {
    outbound_JSON_message[device._id].state = device.payload_off;
  }
  else {
    outbound_JSON_message[device._id].state = device.payload_on;
  }

  console.log('[WS] front_to_mqtt');
  socket.emit('front_to_mqtt', outbound_JSON_message);
}

function open_camera_modal(device){
  open_modal_by_ID("camera_modal");
  document.getElementById("camera_image").src = "/camera?_id=" + device._id;
}

function close_camera_modal(){
  close_modal_by_ID("camera_modal");
  document.getElementById("camera_image").src = "images/devices/cctv.svg";
}

function close_camera_modal_by_background_click(self, event){
  // here, self could be the ID directly
  if(event.target == self){
    close_camera_modal();
  }
}

function open_sensor_modal(device){
  open_modal_by_ID("sensor_modal");
  document.getElementById("sensor_modal_content").innerHTML = device.state;
}
