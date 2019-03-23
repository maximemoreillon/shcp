var devices_template = [
  {
    type: "light",
    form_fields: [
      {field_name: "command_topic", field_label:"MQTT command topic"},
      {field_name: "status_topic", field_label:"MQTT status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icons: {
      on: "images/devices/light_on.svg",
      off: "images/devices/light_off.svg",
      default: "images/devices/light_off.svg"
    },
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "heater",
    form_fields: [
      {field_name: "command_topic", field_label:"MQTT command topic"},
      {field_name: "status_topic", field_label:"MQTT status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icons: {
      on: "images/devices/heater_on.svg",
      off: "images/devices/heater_off.svg",
      default: "images/devices/heater_off.svg"
    },
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "fan",
    form_fields: [
      {field_name: "command_topic", field_label:"MQTT command topic"},
      {field_name: "status_topic", field_label:"MQTT status topic"},
      {field_name: "payload_on", field_label:"Payload ON"},
      {field_name: "payload_off", field_label:"Payload OFF"}
    ],
    icons: {
      on: "images/devices/fan_on.svg",
      off: "images/devices/fan_off.svg",
      default: "images/devices/fan_off.svg"
    },
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "sensor",
    form_fields: [
      {status_topic: "stream_url", field_label:"MQTT status topic"}
    ],
    icons: "images/devices/thermometer.svg",
    onclick: function(){alert("hello")}
  },
  {
    type: "camera",
    form_fields: [
      {field_name: "stream_url", field_label:"Stream URL"}
    ],
    icons: {
      default: "images/devices/cctv.svg"
    },
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
  document.getElementById("camera_image").src = device.stream_url;
}

function close_camera_modal(){
  open_modal_by_ID("camera_modal");
  document.getElementById("camera_image").src = "";
}
