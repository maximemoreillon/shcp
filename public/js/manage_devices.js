var socket = io();

Vue.component('device',{
  template: '<span class="device mdi"></span>',
});

var app = new Vue({
  el: '#app',
  data: {
    edit_mode: false,
    devices: [],
    new_device : {
      _id: "new",
      type: 'new',
      position: {
        x : 0,
        y : 0
      },
    },
    form_fields: [],
    selected_device : {},
  },
  methods: {
    device_action: function(device){
      if(this.edit_mode){
        // make a copy of the device
        this.selected_device = JSON.parse(JSON.stringify(device));
      }
      else {
        // If not in edit mode, perform the action of the device
        // Look in device templates for matching device type and set action accordingly
        for(var template_index=0; template_index<device_templates.length; template_index++){
          if(device_templates[template_index].type === device.type){
            return device_templates[template_index].onclick(device);
          }
        }
        // If no match, return unkown
        return alert("No action for given device");
      }
    },
    device_icon: function(device){
      // Look in device templates for matching device type and set icon accordingly
      for(var template_index=0; template_index<device_templates.length; template_index++){
        if(device_templates[template_index].type === device.type){
          // Check if device is connected
          if(device.state){
            if(device.state === "{'state':'disconnected'}"){
              return "mdi-wifi-off";
            }
          }
          return device_templates[template_index].icon;
        }
      }
      // If no match, return unkown
      return "mdi-help";
    },
    device_form_fields: function(device){
      // Look in device templates for matching device type and set fields accordingly
      for(var template_index=0; template_index<device_templates.length; template_index++){
        if(device_templates[template_index].type === device.type){
          return device_templates[template_index].properties;
        }
      }
      // If no match, return unkown
      return [];
    },
    device_state: function(device){
      return device.state && device.payload_on && device.state === device.payload_on;
    },
    enable_edit_mode: function(){
      this.edit_mode = true;
    },
    disable_edit_mode: function(){
      this.edit_mode = false;
      this.selected_device = {};
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
      this.new_device.position.x = 100.00*event.offsetX/event.target.offsetWidth;
      this.new_device.position.y = 100.00*event.offsetY/event.target.offsetHeight;
      this.selected_device = this.new_device;
    },
    get_device_properties_selected_device: function(){

      var device = {};

      // Basic info
      device._id = app.selected_device._id;
      device.type = app.selected_device.type;
      device.position = app.selected_device.position;

      // Look in device templates for matching device
      for(var template_index=0; template_index<device_templates.length; template_index++){
        if(device_templates[template_index].type === device.type){
          for(var property_index=0; property_index<device_templates[template_index].properties.length; property_index++){
            device[device_templates[template_index].properties[property_index].field_name] = app.selected_device[device_templates[template_index].properties[property_index].field_name];
          }
        }
      }

      return device;
    },
    add_device_in_back_end: function() {
      console.log("[WS] add_one_device_in_back_end");
      var device = this.get_device_properties_selected_device();
      socket.emit('add_one_device_in_back_end', device);
    },
    edit_device_in_back_end: function() {
      console.log("[WS] edit_one_device_in_back_end");
      var device = this.get_device_properties_selected_device();
      socket.emit('edit_one_device_in_back_end', device);
    },
    delete_device_in_back_end: function() {
      console.log("[WS] delete_one_device_in_back_end");
      var device = this.get_device_properties_selected_device();
      socket.emit('delete_one_device_in_back_end', device);
    },
  },
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
