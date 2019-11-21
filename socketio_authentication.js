exports.socketio_middleware = function(socket){
  return function(packet, next){

    // If client previosuly authorized or posesses a valid JWT
    if(socket.authenticated) {
      next();
    }
    else {
      // If the client is not authenticated, only allow him to login

      // Parsing packet
      var ws_event = packet[0];
      var ws_payload = packet[1];

      if(ws_event === 'authenticate'){
        // The user is trying to authenticate using a JWT

        // TODO: VERIFY TOKEN PROPERLY
        if(ws_payload.token === 'poketenaJWT'){
          // The token is valid

          // For future connections, no need to check anymore
          socket.authenticated = true;

          // NOT SURE ABOUT THIS
          socket.emit('authenticated',{});
        }
        else {
          // JWT is invalid
          socket.emit('unauthorized','Invalid JWT');
        }
      }

      else if(ws_event === 'login'){
        // The client is trying to login with a username/password combo

        if(ws_payload.password === "poketenashi"){
          // The credentials are correct

          // Emit a token so the user does not need to login for next connections
          // TODO: GENERATE PROPER TOKEN
          socket.emit('token','poketenaJWT');

          // NOT SURE ABOUT THIS
          socket.emit('authenticated', {});

          // Allow access for future packets
          socket.authenticated = true;
        }
        else {
          // Login Credentials are wrong
          socket.emit('unauthorized','Invalid credentials');
        }
      }
      else {
        // The user is trying to do something else than authenticating
        socket.emit('unauthorized','Authentication required');
      }
    }
  }
}
