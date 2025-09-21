function handleJoinRoom(ws, data, rooms) {
  const currentRoom = rooms[data.roomId];
  const userAddress = ws.session.wallet.address.toLowerCase();

  for (let i = 0; i < currentRoom.players.length; i++) {
    if (currentRoom.players[i].address === userAddress && !currentRoom.players[i].ws) {
      rooms[data.roomId].players[i].ws = ws;
    }
  }

  if (currentRoom.players.length === 2) {
    currentRoom.players.forEach((player, i) =>{
      if (player.ws) {
        player.ws.send(JSON.stringify({
          type: 'StartGame',
          message: 'Both players have joined. Starting game...',
        }));
      }
    })
  }
}

export function handleBaxieSimulationGameRoom(ws, data, rooms) {
  if (rooms[data.roomId]) {
    if (data.type === 'joinRoom') {
      handleJoinRoom(ws, data, rooms);
    }
  }
}