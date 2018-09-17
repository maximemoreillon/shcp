// Manages modal to show connection status
// Get the modal
var modal = document.getElementById('myModal');

socket.on('disconnect', function(){
  modal.style.display = "flex";
});

socket.on('connect', function() {
  modal.style.display = "none";
});
