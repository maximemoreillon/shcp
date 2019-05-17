var socket = io();

// The Vue.js App
var app = new Vue({
  el: '#app',
  data: {
    devices: [],
    edit_mode: false,

    new_device : {
      _id: "new",
      type: 'light',
      position: {
        x : 0,
        y : 0
      },
    },
    // suboptimal
    show_new_device: false,
    new_device_modal_open: false,
  },
  methods: {

    enable_edit_mode: function(){
      this.edit_mode = true;
    },
    disable_edit_mode: function(){
      this.edit_mode = false;
      this.show_new_device = false;
      this.new_device_modal_open = false;
    },
    toggle_edit_mode : function() {
      if(this.edit_mode){
        this.disable_edit_mode();
      }
      else {
        this.enable_edit_mode();
      }
    },
    floorplan_clicked: function(event) {
      if(this.edit_mode){
        this.new_device.position.x = 100.00*event.offsetX/event.target.offsetWidth;
        this.new_device.position.y = 100.00*event.offsetY/event.target.offsetHeight;
        this.show_new_device = true;
        this.new_device_modal_open = true;
      }
    },
    close_new_device_modal: function(){
      this.show_new_device = false;
      this.new_device_modal_open = false;
    }

  },
}) // End of app


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


// THOSE FUNCTIONS COULD BE PUT IN THE APP
function delete_all_devices_in_front_end() {
  // delete all devices
  app.devices.splice(0,app.devices.length);
}

function add_or_update_some_devices_in_front_end(incoming_device_array){
  // Update a device in the vue component data or create it if it does not exist already

  for(var incoming_device_index=0; incoming_device_index < incoming_device_array.length; incoming_device_index ++){
    // Check if device with this ID already exists locally
    var device_exists = false;
    for(var device_index=0; device_index < app.devices.length; device_index ++){
      if(app.devices[device_index]._id === incoming_device_array[incoming_device_index]._id){
        device_exists = true;

        // update the device
        Vue.set(app.devices, device_index, incoming_device_array[incoming_device_index])
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
        break;
      }
    }
  }
}
