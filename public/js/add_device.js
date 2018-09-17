function get_mouse_pos(element,evt) {
  var rect = element.getBoundingClientRect();
  return {
    x: (100*(evt.clientX - rect.left)/element.offsetWidth).toFixed(4),
    y: (100*(evt.clientY - rect.top)/element.offsetHeight).toFixed(4)
  };
}

window.onload = function(e){
  console.log("Onload");

  var floorplan = document.getElementById('floorplan');
  var floorplan_wrapper = document.getElementById('floorplan_wrapper');
  var new_device_wrapper = document.getElementById('new_device_wrapper');
  var modal = document.getElementById('modal');
  new_device_wrapper.style.display = "none";
  modal.style.display = "none";

  floorplan.addEventListener('click',function(evt) {

    var mouse_pos = get_mouse_pos(floorplan,evt);

    new_device_wrapper.style.display = "block";
    new_device_wrapper.style.left = mouse_pos.x.toString()+"%";
    new_device_wrapper.style.top = mouse_pos.y.toString()+"%";

    modal.style.display = "flex";
    modal.style.left = mouse_pos.x.toString()+"%";
    modal.style.top = mouse_pos.y.toString()+"%";

    // Fill the input form
    var position_x_input = document.getElementById('position_x_input');
    var position_y_input = document.getElementById('position_y_input');

    position_x_input.value = mouse_pos.x;
    position_y_input.value = mouse_pos.y;

  },false);

  document.getElementById("modal_close_button").onclick = function() {
    modal.style.display = "none";
    new_device_wrapper.style.display = "none";
  };

  document.getElementById("submit_button").onclick = function() {

    var add_device_form = document.getElementById('add_device_form');
    add_device_form.submit();


  };
}

function update_device_icon(select_object){

  var new_device_image = document.getElementById('new_device_image');

  var new_image;
  switch (select_object.value) {
    case "light":
      new_image = "images/light.svg";
      break;
    case "lock":
      new_image = "images/lock.svg";
      break;
    case "climate":
      new_image = "images/ac.svg";
      break;
    default:
      new_image = "images/question-mark.svg";

  }

  new_device_image.src = new_image;
}
