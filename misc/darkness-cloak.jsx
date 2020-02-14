// http://www.firthworks.com/roger/cloak/

// The "Cloak of Darkness" specification
//
// The various implementations have been made as similar as possible. That is, things like object names and room descriptions should be identical, and the general flow of the game should be pretty comparable. Having said that, the games are implemented using the native capabilities of the various systems, using features that a beginner might be expected to master; there shouldn't be any need to resort to assembler routines, library hacks, or other advanced techniques. The target is to write naturally and simply, while sticking as closely as possible to the goal of making the games directly equivalent.
//
// "Cloak of Darkness" is not going to win prizes for its prose, imagination or subtlety. Or scope: it can be played to a successful conclusion in five or six moves, so it's not going to keep you guessing for long. (On the other hand, it may qualify as the most widely-available game in the history of the genre.) There are just three rooms and three objects.
//
// The Foyer of the Opera House is where the game begins. This empty room has doors to the south and west, also an unusable exit to the north. There is nobody else around.
// The Bar lies south of the Foyer, and is initially unlit. Trying to do anything other than return northwards results in a warning message about disturbing things in the dark.
// On the wall of the Cloakroom, to the west of the Foyer, is fixed a small brass hook.
// Taking an inventory of possessions reveals that the player is wearing a black velvet cloak which, upon examination, is found to be light-absorbent. The player can drop the cloak on the floor of the Cloakroom or, better, put it on the hook.
// Returning to the Bar without the cloak reveals that the room is now lit. A message is scratched in the sawdust on the floor.
// The message reads either "You have won" or "You have lost", depending on how much it was disturbed by the player while the room was dark.
// The act of reading the message ends the game.
// And that's all there is to it...
let darknessCloakStory = {
  author: "Frank Hale",
  title: "Darkness Cloak",
  date: "22 November 2015",
  startingRoom: "foyer",
  startingInventory: ["cloak"],
  text: [
    "You are in the foyer of the Opera House. There is nobody around. There is an unusable exit to the north, but there are rooms which lay to the east and south.",
    "You are in the cloakroom and you see a brass hook on the wall.",
    "You take off your cloak and place it on the hook. The word around you suddenly seems more vivid and full of light.",
    "You are in the bar, it's pitch black.",
    "You are in the bar and you can see a message on the floor",
    "The message reads you've won!",
    "You've disturbed the room and things are not as they were when you entered.",
    "I don't understand the command you've given."
  ],
  rooms: ["foyer", "cloakroom", "bar"],
  objects: ["cloak", "message"],
  definitions: {
    // objects
    cloak: {
      type: "clothing",
      worn: true,
      actions: [
        {
          name: "hang cloak",
          what: "cloak",
          synonyms: ["put", "place", "hang"],
          action: (player) => {}
        }
      ]
    },
    message: {
      actions: [
        {
          name: "read message",
          what: "message",
          synonyms: ["read", "look at"],
          action: (player) => {}
        }
      ]
    },
    // rooms
    foyer: {
      descriptionId: 0,
      objects: [],
      exits: {
        south: "bar",
        east: "cloakroom"
      }
    },
    cloakroom: {
      descriptionId: 1,
      objects: [],
      exits: {
        east: "foyer"
      }
    },
    bar: {
      descriptionId: 2,
      objects: [],
      exits: {
        north: "foyer"
      }
    }
  }
};

const DarknessCloak = (() => {
  const browser = require('remote').getCurrentWindow();

  browser.openDevTools();

  let directions = {
    north: ["north", "n"],
    south: ["south", "s"],
    east: ["east", "e"],
    west: ["west", "w"]
  };

  class IFEngine extends React.Component {
    constructor() {
      super();
      this.onCommandEntered = this.onCommandEntered.bind(this)

      this.state = {
        player: {
          score: 0,
          moves: 0,
          currentRoom: {},
          inventory: []
        }
      };
    }
    startGame() {
      this.setState({
        player: {
          score: 0,
          moves: 0,
          currentRoom: {},
          inventory: []
        }
      }, () => {
        const data = this.state.data;
        this.printResponse(`<b>${data.title}</b><br/>By: ${data.author}<br/>Date: ${data.date}<hr noshade />`);

        const startingRoom = data.definitions[data.startingRoom];
        const roomDesc = data.text[startingRoom.descriptionId];
        this.state.player.currentRoom = startingRoom;

        this.printResponse(`<br/>${roomDesc}`);
      });
    }
    printResponse(text) {
      this.state.messages.append(text);
    }
    scrollContentArea() {
      this.state.messages.scrollTop(this.state.messages[0].scrollHeight);
    }
    onCommandEntered(text) {
      // if(text.startsWith("/") && text.length > 1) {
      //   const textSplit = text.split(" ");
      //   const command = textSplit[0];
      //   const args = textSplit.slice(1);
      //
      //   //console.log(command, args);
      //
      //   _.forEach(this.commands, (cmd) => {
      //     if(_.indexOf(cmd.synonyms, command) > -1) {
      //       cmd.func(args);
      //     }
      //   });
      // } else {
      //   if(this.state.client !== undefined &&
      //      this.state.currentChannel !== undefined) {
      //     this.state.client.say(this.state.currentChannel, text);
      //   }
      // }
    }
    componentDidMount() {
      const $messages = $("#messages");
      const resizeMessagesDiv = () => { $messages.height(window.innerHeight - 55); };
      resizeMessagesDiv();
      $(window).resize((e) => { resizeMessagesDiv(); });
      this.setState({
        data: this.props.data,
        messages: $messages
      }, () => {
        this.startGame();
      });
    }
    render() {
      return (
        <div>
          <div id="messages"></div>
          <CommandBox onKeyEnter={this.onCommandEntered} />
        </div>
      );
    }
  }

  return {
    init: (gameData) => {
      ReactDOM.render(<IFEngine data={gameData} />, document.getElementById("ui"));
    }
  };
})();

$(document).ready(function() {
  DarknessCloak.init(darknessCloakStory);
});
