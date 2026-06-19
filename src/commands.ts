import { type ParseCommandResult } from './protocol';
import { applyTheme } from './themes.js';
import { roomState, joinRoom, leaveRoom } from './room.js';
import { notify } from './notify.js';

export function executeCommand(result: ParseCommandResult): void {
  if (!result.ok) {
    notify(result.error);
    return;
  }

  const { command } = result;

  switch (command.cmd) {
    case 'theme':
      if (roomState.connected && roomState.role === 'viewer') {
        notify('Viewers cannot change the theme. Only the host can.');
        return;
      }
      applyTheme(command.theme);
      break;

    case 'room':
      if (roomState.connected) {
        notify(`Already in room "${roomState.roomId}". Use /exit first.`);
        return;
      }
      joinRoom(command.roomId);
      break;

    case 'exit':
      if (!roomState.connected) {
        notify('Not currently in a room.');
        return;
      }
      leaveRoom();
      break;
  }
}
