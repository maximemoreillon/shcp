function get_device_image_src(device){

  var device_image_src;

  switch (device.type) {
    case "light":
      if(device.state == device.payload_on) {
        device_image_src = "images/devices/light_on.svg";
      }
      else {
        device_image_src = "images/devices/light_off.svg";
      }
      break;

    case "lock":
      if(device.state == device.payload_on) {
        device_image_src = "images/devices/lock_locked.svg";
      }
      else {
        device_image_src = "images/devices/lock_unlocked.svg";
      }
      break;

    case "fan":
      if(device.state == device.payload_on) {
        device_image_src = "images/devices/fan_on.svg";
      }
      else {
        device_image_src = "images/devices/fan_off.svg";
      }
      break;

    case "switch":
      if(device.state == device.payload_on) {
        device_image_src = "images/devices/switch_on.svg";
      }
      else {
        device_image_src = "images/devices/switch_off.svg";
      }
      break;

    case "camera":
      device_image_src = "images/devices/cctv.svg";
      break;

    case "temperature":
      device_image_src = "images/devices/thermometer.svg";
      break;

    case "humidity":
      device_image_src = "images/devices/humidity.svg";
      break;

    case "power":
      device_image_src = "images/devices/electricity.svg";
      break;

    case "sensor":
      device_image_src = "images/devices/humidity.svg";
      break;

    default:
      device_image_src = "images/devices/unknown.svg";
  }
  return device_image_src;
}
