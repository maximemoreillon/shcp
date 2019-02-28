function open_modal_by_ID(modal_ID){

  // Get the modal
  var modal_wrapper = document.getElementById(modal_ID);

  // Get the modal container
  // Here, getElementsByClassName would be better but not supported by old browsers
  var modal_container = modal_wrapper.getElementsByTagName("div")[0];

  // Make modal visible
  // wrapper
  modal_wrapper.style.visibility = "visible";
  modal_wrapper.style.opacity = "1";
  // Container
  modal_container.style.opacity = "1";
  modal_container.style.width = "80%";

}

function close_modal_by_ID(modal_ID){

  // Get the modal
  var modal_wrapper = document.getElementById(modal_ID);

  // Get the modal container
  // Here, getElementsByClassName would be better but not supported by old browsers
  var modal_container = modal_wrapper.getElementsByTagName("div")[0];

  // Revert values back to original CSS stylesheet
  // Container
  modal_container.style.width = null;
  modal_container.style.opacity = null;
  // Wrapper
  modal_wrapper.style.opacity = null;
  modal_wrapper.style.visibility = null;
}


function close_modal_by_background_click(self, event){
  // here, self could be the ID directly
  if(event.target == self){
    close_modal_by_ID(self.id);
  }
}
