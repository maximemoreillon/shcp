function get_device_image_src(id){

  var device_image_src;

  // SHOULD PROBABLY CHECK IF THOS EXISTS

  switch (devices[id].type) {
    case "light":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/light_on.svg";
      }
      else {
        device_image_src = "images/devices/light_off.svg";
      }
      break;

    case "lock":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/lock_locked.svg";
      }
      else {
        device_image_src = "images/devices/lock_unlocked.svg";
      }
      break;

    case "fan":
      if(devices[id].state == devices[id].payload_on) {
        device_image_src = "images/devices/fan_on.svg";
      }
      else {
        device_image_src = "images/devices/fan_off.svg";
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

    default:
      device_image_src = "images/devices/unknown.svg";
  }
  return device_image_src;
}

function get_device_image_src_by_type(type){

  // TODO: combine with the above

  var device_image_src;

  switch (type) {
    case "light":
      device_image_src = "images/devices/light_off.svg";
      break;

    case "lock":
      device_image_src = "images/devices/lock_locked.svg";
      break;

    case "fan":
      device_image_src = "images/devices/fan_off.svg";
      break;

    case "heater":
      device_image_src = "images/devices/heater_off.svg";
      break;

    case "temperature":
      device_image_src = "images/devices/thermometer.svg";
      break;

    case "humidity":
      device_image_src = "images/devices/humidity.svg";
      break;

    case "camera":
      device_image_src = "images/devices/cctv.svg";
      break;

    default:
      device_image_src = "images/devices/unknown.svg";
  }
  return device_image_src;
}
