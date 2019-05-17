var device_templates = [
  {
    type: "light",
    properties: [
      {key: "command_topic", label:"Command topic"},
      {key: "status_topic", label:"Status topic"},
      {key: "payload_on", label:"Payload ON"},
      {key: "payload_off", label:"Payload OFF"}
    ],
    icon: "mdi-lightbulb",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "heater",
    properties: [
      {key: "command_topic", label:"Command topic"},
      {key: "status_topic", label:"Status topic"},
      {key: "payload_on", label:"Payload ON"},
      {key: "payload_off", label:"Payload OFF"}
    ],
    icon: "mdi-radiator",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "fan",
    properties: [
      {key: "command_topic", label:"Command topic"},
      {key: "status_topic", label:"Status topic"},
      {key: "payload_on", label:"Payload ON"},
      {key: "payload_off", label:"Payload OFF"}
    ],
    icon: "mdi-fan",
    onclick: function(device){toggle_device_state(device)}
  },
  {
    type: "sensor",
    properties: [
      {key: "status_topic", label:"Status topic"},
      {key: "name", label: "Name"},
      {key: "key", label: "JSON key"},
      {key: "unit", label: "Unit"},
    ],
    icon: "mdi-gauge",
    onclick: function(device){open_sensor_modal_v2(device)}
  },
  {
    type: "camera",
    properties: [
      {key: "stream_url", label:"Stream URL"}
    ],
    icon: "mdi-cctv",
    onclick: function(device){open_camera_modal(device)}
  },

]



// Actions to clicks on device
function toggle_device_state(device){
  // Sends WS message to toggle the device through MQTT

  var message = {};
  message.command_topic = device.command_topic;

  // Just send the opposite state
  if(device.state == device.payload_on) {
    message.payload = device.payload_off;
  }
  else {
    message.payload = device.payload_on;
  }

  console.log('[WS] toggle_device_state');
  socket.emit('front_to_mqtt', message);
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

  var modal_content = "NO DATA";

  if(device.state){
    if(device.key){
      modal_content = JSON.parse(device.state)[device.key];
      if(device.unit) {
        modal_content += device.unit;
      }
    }
    else {
      modal_content = device.state;
    }
  }

  document.getElementById("sensor_modal_content").innerHTML = modal_content;

}

function open_sensor_modal_v2(device){

}

function debug_device(device){
  var output = "";

  for(prop in device){
    output = output + prop + " ";
  }

  console.log(output);
}
