import { anthropic } from '@ai-sdk/anthropic';
import { Computer } from '../Computer';
import { CoreTool } from 'ai';

export const initTools = (computer: Computer) => {
  return {
    computer: anthropic.tools.computer_20241022({
      displayWidthPx: computer.config.display.width,
      displayHeightPx: computer.config.display.height,
      execute: async ({ action, coordinate, text }) => {
        switch (action) {
          case 'screenshot':
            const screenshot = await computer.system.display
              .getScreenshot()
              .catch((error) => {
                console.error(error);
                return null;
              });

            if (!screenshot) {
              return 'Failed to take screenshot';
            }

            return {
              type: 'image',
              image: await screenshot
                .arrayBuffer()
                .then((buffer) => Buffer.from(buffer).toString('base64')),
            };
          case 'key':
            if (!text) {
              return 'No key provided';
            }
            await computer.system.keyboard.pressKey({ key: text });
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Pressed keys';
          case 'type':
            if (!text) {
              return 'No text provided';
            }
            await computer.system.keyboard.type({ text });
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Typed text';
          case 'mouse_move':
            if (coordinate) {
              await computer.system.mouse.move({
                x: coordinate[0],
                y: coordinate[1],
              });
              await new Promise((resolve) => setTimeout(resolve, 300));
              return 'Moved mouse';
            }
            return 'Invalid coordinate';
          case 'left_click':
            await computer.system.mouse.leftClick();
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Left clicked';
          case 'right_click':
            await computer.system.mouse.rightClick();
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Right clicked';
          case 'middle_click':
            await computer.system.mouse.middleClick();
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Middle clicked';
          case 'double_click':
            await computer.system.mouse.doubleClick();
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Double clicked';
          case 'cursor_position':
            const position = await computer.system.mouse.getPosition();
            return `Cursor position: X=${position.x}, Y=${position.y}`;
          case 'left_click_drag':
            if (!coordinate) {
              return 'No coordinate provided';
            }

            await computer.system.mouse.leftClickDrag({
              x: coordinate[0],
              y: coordinate[1],
            });
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'Left clicked and dragged';
          default:
            return 'Invalid action';
        }
      },
      experimental_toToolResultContent(result) {
        return typeof result === 'string'
          ? [{ type: 'text', text: result }]
          : [
              {
                type: 'image',
                data: result.image,
                mimeType: 'image/png',
              },
            ];
      },
    }),
    bash: anthropic.tools.bash_20241022({
      execute: async ({ command, restart }) => {
        if (restart) {
          await computer.system.bash.restart();
        }
        return await computer.system.bash
          .execute({ command })
          .catch((error) => {
            console.error(error);
            return 'Failed to execute command';
          });
      },
    }),
    str_replace_editor: anthropic.tools.textEditor_20241022({
      execute: async ({
        command,
        path,
        file_text,
        insert_line,
        new_str,
        old_str,
        view_range,
      }) => {
        switch (command) {
          case 'view':
            return await computer.system.editor.viewFile({
              path,
              viewRange: view_range as [number, number] | undefined,
            });
          case 'create':
            await computer.system.editor.createFile({
              path,
              content: file_text as string,
            });
            return 'Created file';
          case 'insert':
            if (!file_text) {
              return 'No file text provided';
            }
            await computer.system.editor.insertText({
              path,
              text: file_text,
              line: insert_line as number,
            });
            return 'Inserted text';
          case 'str_replace':
            if (!old_str || !new_str) {
              return 'No old or new string provided';
            }
            await computer.system.editor.replaceString({
              path,
              oldStr: old_str,
              newStr: new_str,
            });
            return 'Replaced text';
          case 'undo_edit':
            await computer.system.editor.undoLastEdit({ path });
            return 'Undid edit';
          default:
            return 'Invalid command';
        }
      },
    }),
  } as Record<string, CoreTool>;
};
