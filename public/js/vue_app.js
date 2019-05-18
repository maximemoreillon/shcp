

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

Vue.component('device_icon',{
  props: {
    device: {
      type: Object,
      required: true,
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
  template: `
    <div
      class="device_icon_wrapper"
      v-bind:style="{left: device.position.x + '%',top: device.position.y + '%'}"
    >
      <span
        class="device_icon mdi"
        v-bind:class="[icon_class, {edit:edit_mode}]"
        v-on:click="icon_clicked"
      ></span>
      <div
        class="icon_badge"
        v-if="device_disconnected"
      >
        <span class="mdi mdi-wifi-off"></span>
      </div>
    </div>
  `,
  methods: {
    icon_clicked: function(){
      this.$emit('icon_clicked');
    }
  },
  computed: {
    device_disconnected: function(){
      if(this.device.state){
        if(this.device.state === "{'state':'disconnected'}") return true;
      }
      return false;
    }
  }
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
    <device_icon
      v-bind:device="device"
      v-bind:icon_class="icon_class"
      v-on:icon_clicked="icon_clicked"
    ></device_icon>

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
