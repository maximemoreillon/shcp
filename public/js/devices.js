// Functions shared across multiple devices
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



Vue.component('light',{
  props:['device','edit_mode'],
  data: function () {
    return {
      form_fields: [
        {key: "command_topic", label:"Command topic"},
        {key: "status_topic", label:"Status topic"},
        {key: "payload_on", label:"Payload ON"},
        {key: "payload_off", label:"Payload OFF"}
      ],
    }
  },
  template: `
    <device
      v-bind:icon_class="compute_icon_class"
      v-bind:device="device"
      v-bind:form_fields="form_fields"
      v-bind:edit_mode="edit_mode"
      v-on:icon_clicked="toggle"
    ></device>
  `,
  methods: {
    toggle: function(){
      toggle_device_state(this.device)
    },
  },
  computed: {
    compute_icon_class : function(){
      var icon_class = ["mdi-lightbulb"];

      if(this.device.state && this.device.payload_on){
        if(this.device.state === this.device.payload_on){
          icon_class.push("on");
        }
      }
      return icon_class;
    }
  },
});

Vue.component('heater',{
  props:['device','edit_mode'],
  data: function () {
    return {
      form_fields: [
        {key: "command_topic", label:"Command topic"},
        {key: "status_topic", label:"Status topic"},
        {key: "payload_on", label:"Payload ON"},
        {key: "payload_off", label:"Payload OFF"}
      ],
    }
  },
  template: `
    <device
      v-bind:icon_class="compute_icon_class"
      v-bind:device="device"
      v-bind:form_fields="form_fields"
      v-bind:edit_mode="edit_mode"
      v-on:icon_clicked="toggle"
    ></device>
  `,
  methods: {
    toggle: function(){
      toggle_device_state(this.device)
    },
  },
  computed: {
    compute_icon_class : function(){
      var icon_class = ["mdi-radiator-disabled"];
      if(this.device.state && this.device.payload_on){
        if(this.device.state === this.device.payload_on){
          icon_class = ["mdi-radiator"];
          icon_class.push("on");
        }
      }
      return icon_class;
    }
  },
});

Vue.component('fan',{
  props:['device','edit_mode'],
  data: function () {
    return {
      form_fields: [
        {key: "command_topic", label:"Command topic"},
        {key: "status_topic", label:"Status topic"},
        {key: "payload_on", label:"Payload ON"},
        {key: "payload_off", label:"Payload OFF"}
      ],
    }
  },
  template: `
    <device
      v-bind:icon_class="compute_icon_class"
      v-bind:device="device"
      v-bind:form_fields="form_fields"
      v-bind:edit_mode="edit_mode"
    ></device>
  `,
  methods: {
    toggle: function(device){
      toggle_device_state(device)
    },
  },
  computed: {
    compute_icon_class : function(){
      var icon_class = ["mdi-fan-off"];
      if(this.device.state && this.device.payload_on){
        if(this.device.state === this.device.payload_on){
          icon_class = ["mdi-fan"];
          icon_class.push("on");
        }
      }
      return icon_class;
    }
  }
});


Vue.component('sensor',{
  props:['device','edit_mode'],
  data: function () {
    return {
      form_fields: [
        {key: "name", label:"Name"},
        {key: "status_topic", label:"Status topic"},
        {key: "key", label: "JSON key"},
        {key: "unit", label: "Unit"},
      ],
      modal_open: false,
    }
  },
  template: `
    <device
      icon_class="mdi-gauge"
      v-bind:device="device"
      v-bind:form_fields="form_fields"
      v-bind:edit_mode="edit_mode"
      v-on:icon_clicked="open_modal"
    >
      <!-- This device features a modal -->
      <modal
        v-bind:show="modal_open"
        v-on:close_modal="close_modal"
      >
        <h3>
          {{modal_title}}
        </h3>
        <div>
          {{modal_content}}
        </div>
      </modal>
    </device>
  `,
  methods: {
    open_modal: function(){
      this.modal_open = true;
    },
    close_modal: function() {
      this.modal_open = false;
    }
  },
  computed: {
    modal_content: function(){

      if(this.device.state){
        var state = JSON.parse(this.device.state);

        if(this.device.key){
          if(this.device.unit){
            return String(state[this.device.key]) + this.device.unit;
          }
          else return state[this.device.key];
        }
        else return state;
      }
      else return "No data";
    },
    modal_title: function(){
      if(this.device.name) return this.device.name;
      else return "ID: " + this.device._id;
    },
  }
});

Vue.component('camera',{
  props:['device','edit_mode'],
  data: function () {
    return {
      form_fields: [
        {key: "stream_url", label:"Stream URL"},
      ],
      modal_open: false,
      modal_content: "images/devices/cctv.svg"
    }
  },
  template: `
    <device
      icon_class="mdi-cctv"
      v-bind:device="device"
      v-bind:form_fields="form_fields"
      v-bind:edit_mode="edit_mode"
      v-on:icon_clicked="open_modal"
    >
      <!-- This device features a modal -->
      <modal
        v-bind:show="modal_open"
        v-on:close_modal="close_modal"
      >
        <img class="camera_image" v-bind:src="modal_content">
      </modal>
    </device>
  `,
  methods: {
    open_modal: function(){
      this.modal_open = true;
      this.modal_content = "/camera?_id=" + this.device._id;
      //this.modal_content = "images/devices/cctv.svg";
    },
    close_modal: function() {
      this.modal_content = "images/devices/cctv.svg";
      this.modal_open = false;
    }
  },
});
