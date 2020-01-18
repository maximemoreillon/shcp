function open_modal_by_ID(modal_ID){

  // Get the modal
  var modal_wrapper = document.getElementById(modal_ID);

  // Get the modal container
  // Here, getElementsByClassName would be better but not supported by old browsers
  var modal_container = modal_wrapper.getElementsByTagName("DIV")[0];

  // Make modal visible
  modal_wrapper.classList.add("modal_wrapper_visible");
  modal_container.classList.add("modal_container_visible");
}

function close_modal_by_ID(modal_ID){

  // Get the modal
  var modal_wrapper = document.getElementById(modal_ID);

  // Get the modal container
  // Here, getElementsByClassName would be better but not supported by old browsers
  var modal_container = modal_wrapper.getElementsByTagName("div")[0];

  modal_wrapper.classList.remove("modal_wrapper_visible");
  modal_container.classList.remove("modal_container_visible");
}


function close_modal_by_background_click(self, event){
  // here, self could be the ID directly
  if(event.target == self){
    close_modal_by_ID(self.id);
  }
}


// modal deployer
function Modal(modal_ID){

  // parameters
  this.closable = true;
  this.modal_ID = modal_ID;

  // get the modal wrapper (bbackground)
  var modal_wrapper = document.getElementById(modal_ID);

  // save original modal
  var modal_original_content = modal_wrapper.innerHTML;

  // clear original content
  modal_wrapper.innerHTML = "";

  // assign appropriate class to wrapper
  modal_wrapper.className = "modal_wrapper";

  // close modal by background click
  function onclick_handler(modal){
    return function() {
      if(modal.closable) close_modal_by_ID(modal.modal_ID);
    }
  }

  modal_wrapper.addEventListener("click", onclick_handler(this));

  // Create the modal container (window)
  var modal_container = document.createElement("DIV");
  modal_container.className = "modal_container";

  // do not close modal if content clicked, only if background is
  modal_container.addEventListener("click", function(event){
    event.stopPropagation();
  });

  // append content
  modal_wrapper.appendChild(modal_container);

  // create a div inside the container to deal with padding and overflows
  var modal_content = document.createElement("DIV");
  modal_content.className = "modal_content";
  modal_container.appendChild(modal_content);


  // Restore original content
  modal_content.innerHTML = modal_original_content;




}
