var socket = io();

// Example component
Vue.component('light', {
  data: function () {
    return {
      count: 0
    }
  },
  template: '<span class="device mdi mdi-help" v-on:click="scream"></span>',
  methods: {
    scream : function() {
      console.log("AAAAH");
    }
  },
});

Vue.component('device',{
  data: function () {
    return {
      count: 0
    }
  },
  template: '<span class="device mdi" v-on:click="scream"></span>',
  methods: {
    scream : function() {
      console.log("AAAAH");
    }
  },
});

var app = new Vue({
  el: '#app',
  data: {
    devices: [],
    device_templates: {
      light: {
        icon: "mdi-lightbulb",
        onclick: function(device){toggle_device_state(device)}
      },
      heater: {
        icon: "mdi-radiator",
        onclick: function(device){toggle_device_state(device)}
      },
      camera: {
        icon: "mdi-cctv",
        onclick: function(device){open_camera_modal(device)}
      },
      fan: {
        icon: "mdi-fan",
        onclick: function(device){console.log(device)}
      },
      sensor: {
        icon: "mdi-gauge",
        onclick: function(device){console.log(device)}
      },
    },
  },
  methods: {
    open_device_page : function(device){
      window.location.href = "/show_device?_id="+device._id;
    }
  }
})




// respond to websocket events
socket.on('connect', function() {
  console.log("[WS] connected");
  close_modal_by_ID('disconnected_modal');
});

socket.on('disconnect', function(){
  console.log("[WS] disconnected");
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

function delete_all_devices_in_front_end() {
  // delete all devices
  app.devices.splice(0,app.devices.length);
}

function add_or_update_some_devices_in_front_end(incoming_device_array){

  for(var incoming_device_index=0; incoming_device_index < incoming_device_array.length; incoming_device_index ++){
    // Check if device with this ID already exists locally
    var device_exists = false;
    for(var device_index=0; device_index < app.devices.length; device_index ++){
      if(app.devices[device_index]._id === incoming_device_array[incoming_device_index]._id){
        device_exists = true;

        // update the device
        Vue.set(app.devices, device_index, incoming_device_array[incoming_device_index])

        // No need to iterate more
        break;
      }
    }
    // the device didn't exist already, so create it
    if(!device_exists){
      app.devices.push(incoming_device_array[incoming_device_index]);
    }
  }
}

function delete_some_devices_in_front_end(devices_to_delete){
  // devices_to_delete is an array
  for(var index=0; index<devices_to_delete.length; index++){
    for(var device_index=0; device_index < app.devices.length; device_index ++){
      if(app.devices[device_index]._id === devices_to_delete[index]._id){

        // delete the device
        app.devices.splice(device_index,1);

        // No need to iterate more
        break;
      }
    }
  }
}


function add_device_in_back_end() {
  console.log("[WS] add_one_device_in_back_end");
  var device = {};
  socket.emit('add_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}

function edit_device_in_back_end() {
  console.log("[WS] edit_one_device_in_back_end");
  var device = {};
  socket.emit('edit_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}

function delete_device_in_back_end() {
  console.log("[WS] delete_one_device_in_back_end");
  var device = {};
  socket.emit('delete_one_device_in_back_end', device);
  disable_edit_mode();
  close_all_modals();
}


function get_mouse_pos_percent(element,evt) {
  // Gets the mouse position relative to element in percent

  var rect = element.getBoundingClientRect();

  var position_pixels = {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  }

  var position_percent = {
    x: 100.00*position_pixels.x/element.offsetWidth,
    y: 100.00*position_pixels.y/element.offsetHeight,
  }

  return position_percent;
}
