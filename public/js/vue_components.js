Vue.component('modal',{
  props: {
    show: {
      type: Boolean,
      default: false
    },
  },
  template: `
    <div
      class="vue_modal_wrapper"
      v-on:click.self="close_modal"
      v-bind:class="[{modal_wrapper_open: show}]"
    >
      <div
        class="vue_modal_container"
        v-bind:class="[{modal_container_open: show}]"
      >
        <slot></slot>
      </div>
    </div>
  `,
  methods: {
    close_modal : function(){
      this.$emit('close_modal');
    }
  }
});

Vue.component('edit-form',{
  props: ['device_copy', 'form_fields'],
  template: `
    <div class = "properties_container">
      <table>
        <tr v-for="form_field in form_fields" v-bind:key="form_field.key">
          <td>{{form_field.label}}</td>
          <td>
            <!-- V-MODEL IS TWO WAY BINDING! -->
            <input
              type="text"
              v-model="device_copy[form_field.key]"
            >
          </td>
        </tr>
      </table>

      <!-- Buttons -->
      <div class="buttons_container">
        <button v-on:click="edit_device_in_back_end">Update device</button>
        <button v-on:click="delete_device_in_back_end">Delete device</button>
      </div>
    </div>
  `,
  methods: {
    get_properties_for_db: function(){
      // Filter out unwanted properties to send to th DB

      var properties = {};

      // Basic properties
      properties._id = this.device_copy._id;
      properties.type = this.device_copy.type;
      properties.position = this.device_copy.position;

      // Specific device properties, taken from fields
      for(var field_index=0; field_index<this.form_fields.length; field_index++){
        properties[this.form_fields[field_index].key] = this.device_copy[this.form_fields[field_index].key];
      }

      return properties;
    },
    // Connection with back end
    edit_device_in_back_end: function() {
      console.log("[WS] edit_one_device_in_back_end");
      var properties = this.get_properties_for_db(this.device_copy);
      //console.log(properties)
      socket.emit('edit_one_device_in_back_end', properties);
      this.$emit('close_modal');
    },
    delete_device_in_back_end: function() {
      console.log("[WS] delete_one_device_in_back_end");
      var properties = this.get_properties_for_db(this.device_copy);
      socket.emit('delete_one_device_in_back_end', properties);
      this.$emit('close_modal');
    },
  },
});


Vue.component('new_device_form',{
  props: ['device_copy'],
  data: function() {
    return {
      device_types: [
        'light',
        'heater',
        'fan',
        'sensor',
        'camera'
      ],
    }
  },
  template: `
    <div class = "properties_container">
      <table>
        <tr>
          <td>Type</td>
          <td>
            <select id="type_selector" v-model="device_copy.type">
              <option v-for="device_type in device_types">
                {{device_type}}
              </option>
            </select>
          </td>
        </tr>
      </table>

      <!-- Buttons -->
      <div class="buttons_container">
        <button v-on:click="add_device_in_back_end">Create device</button>
      </div>
    </div>
  `,
  methods: {
    add_device_in_back_end: function() {
      console.log("[WS] add_one_device_in_back_end");
      socket.emit('add_one_device_in_back_end', this.device_copy);
      this.$emit('close_modal');
    },
  },
});



// A general device
Vue.component('device',{
  props: {
    device: {
      type: Object,
      required: true,
    },
    form_fields: {
      type: Array,
      // Array defaults must be returned from a factory function
      default: function(){return []},
    },
    icon_class: {
      type: [Array, String],
      default: "mdi-help"
    },
    edit_mode: {
      type: Boolean,
      default: false
    },
  },
  data: function () {
    return {
      device_copy: {},
      edit_modal_open: false,
    }
  },
  template: `
  <div class="device_wrapper">
    <!-- wrap everything into a DIV because single root element -->

    <!-- the icon displayed on the floorplan -->
    <span
      class="device mdi"
      v-bind:class="[icon_class, {edit:edit_mode}]"
      v-bind:style="{left: device.position.x + '%',top: device.position.y + '%'}"
      v-on:click="icon_clicked"
    ></span>

    <!-- form to edit the device -->
    <!-- Currently placed inside a modal -->
    <modal
      v-bind:show="edit_modal_open"
      v-on:close_modal="close_edit_modal"
    >
      <edit-form
        v-bind:form_fields="form_fields"
        v-bind:device_copy="device_copy"
        v-on:close_modal="close_edit_modal"
      ></edit-form>
    </modal>

    <!-- device specific stuff goes here -->
    <slot></slot>

  </div>
  `,
  methods: {
    icon_clicked: function(){
      if(this.edit_mode){
        // Make a copy of the device for editing
        this.device_copy = JSON.parse(JSON.stringify(this.device));
        this.open_edit_modal();
      }
      else {
        this.$emit('icon_clicked');
      }
    },
    open_edit_modal : function () {
      this.edit_modal_open = true;
    },
    close_edit_modal : function () {
      this.edit_modal_open = false;
    },
  },
});


Vue.component('new-device',{
  props: {
    device: Object,
    show: Boolean,
    modal_open: Boolean,
  },
  data: function () {
    return {
      // Nothing
    }
  },
  template: `
  <div class="device_wrapper">
    <!-- wrap everything into a DIV because single root element -->

    <!-- the icon displayed on the floorplan -->
    <span
      class="device mdi mdi-plus-circle-outline edit"
      v-if="show"
      v-bind:style="{left: device.position.x + '%',top: device.position.y + '%'}"
    ></span>

    <!-- form to add the device -->
    <!-- Currently placed inside a modal -->
    <modal
      v-bind:show="modal_open"
      v-on:close_modal="close_modal"
    >
      <new_device_form
        v-bind:device_copy="device"
        v-on:close_modal="close_modal"
      ></new_device_form>
    </modal>

  </div>
  `,
  methods: {
    close_modal: function(){
      this.$emit('close_new_device_modal');
    }
  },
});



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
        <img v-bind:src="modal_content">
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







// Actions shared by multiple devices
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
