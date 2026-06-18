import { type ParseCommandResult } from './protocol';
import { applyTheme } from './themes.js';
import { roomState, joinRoom, leaveRoom } from './room.js';

/**
 * Execute a parsed command result. Call this from the HUD's onExecute handler.
 * Surfaces errors via alert() as agreed.
 */
export function executeCommand(result: ParseCommandResult): void {
  if (!result.ok) {
    alert(result.error);
    return;
  }

  const { command } = result;

  switch (command.cmd) {
    case 'theme':
      if (roomState.role === 'viewer') {
        alert('Viewers cannot change the theme. Only the host can.');
        return;
      }
      applyTheme(command.theme);
      break;

    case 'room':
      if (roomState.connected) {
        alert(`Already in room "${roomState.roomId}". Use /exit first.`);
        return;
      }
      joinRoom(command.roomId);
      break;

    case 'exit':
      if (!roomState.connected) {
        alert('Not currently in a room.');
        return;
      }
      leaveRoom();
      break;
  }
}
