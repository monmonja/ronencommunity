import Phaser from 'phaser';
import {createButton, createCircleButton} from "../../common/buttons.mjs";
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';
import {createGameRoom, joinGameRoom} from "../../common/scene/rooms-scene.mjs";
import { SimpleTextBox } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

export default class RoomSelectionScene extends Phaser.Scene {
  constructor() {
    super('RoomSelectionScene');
  }

  init(data) {
    this.selectedBaxies = data.selectedBaxies || [];
    console.log('this.selectedBaxies', this.selectedBaxies)
  }

  create() {
    this.world = this.add.container(0, 0);

    this.backgroundDay = this.add
      .image(0, 0, 'level-bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.world.add(this.backgroundDay);

    this.scene.launch('MainPanelScene');

    var textBox = new SimpleTextBox(this, {
      x: 300,
      y: 200,
      text: this.add.text(0, 0, "", { fontSize: "20px" })
    });
    this.add.existing(textBox);
    textBox.setSize(220, 60); // must match background for pointer events
    textBox.setInteractive();

    // Pointer click event
    textBox.on("pointerdown", () => {
      const content = textBox.text; // or text.text
      console.log("TextBox content:", content);

      // Copy to clipboard
      navigator.clipboard.writeText(content)
        .then(() => console.log("Copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    });

    createButton({
      scene: this,
      x: 100,
      y: 150,
      width: 120,
      height: 40,
      text: 'Create Room',
      onPointerDown: async () => {
        createGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
        }).then((response) => {
          textBox.start(response.roomId, 30);
          this.ws = new WebSocket(response.wsUrl);

          this.ws.onopen = () => {
            this.ws.send(
              JSON.stringify({
                type: "joinRoom",
                gameId: this.game.customConfig.gameId,
                roomId: response.roomId,
                selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
              })
            );
          };

          this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);

            if (data.type === "StartGame") {
              // Transition to waiting room scene
              this.scene.start("GameScene", { ws: this.ws, roomId: response.roomId });
            }
          };
        });
      }
    });

    const inputText = new InputText(this, 300, 300, 200, 40, {
      type: 'text',
      text: '',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#333333'
    });
    this.add.existing(inputText);

    inputText.on('textchange', (input) => {
      console.log('Current value:', input.text);
    });

    createButton({
      scene: this,
      x: 300,
      y: 150,
      width: 120,
      height: 40,
      text: 'Join Room',
      onPointerDown: async () => {
        joinGameRoom({
          scene: this,
          gameId: this.game.customConfig.gameId,
          roomId: inputText.text,
        }).then((response) => {
          this.ws = new WebSocket(response.wsUrl);

          this.ws.onopen = () => {
            this.ws.send(
              JSON.stringify({
                type: "joinRoom",
                gameId: this.game.customConfig.gameId,
                roomId: response.roomId,
                selectedBaxies: this.selectedBaxies.map((b) => b.tokenId),
              })
            );
            this.ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);

              if (data.type === "StartGame") {
                // Transition to waiting room scene
                this.scene.start("GameScene", { ws: this.ws, roomId: response.roomId });
              }
            };
          };
        });
      }
    })
  }
}