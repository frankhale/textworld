// cloak-of-darkness.jsx - Implementation file for a Cloak of Darkness like game
// Copyright (C) 2015  Frank Hale <frankhale@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const CloakOfDarkness = (() => {
  const gameInfo = {
    title: "Cloak of Darkness",
    description: "Welcome, Cloak of Darkness is an implementation of the de facto 'Hello, World' of interactive fiction by the same name. I've taken some artistic liberties to assist in developing my own IF engine. If you want to find out what a 'Cloak of Darkness' is you can find out more <a href='http://www.firthworks.com/roger/cloak' target='_blank'>here</a>.",
    author: "Frank Hale <frankhale@gmail.com>",
    releaseDate: "22 November 2015",
    dataFile: "/assets/data/cloak-of-darkness-data.txt",
    actions: [
      {
        name: "hang",
        func: (player, system, cmd, args) => {
          if(args.length > 0) {
            system.say("I understood this command but have no logic to perform right now.");
            console.log(`hang ${args[0]}`);
          }
        }
      },
      {
        name: "read",
        func: (player, system, cmd, args) => {
          system.say("I understood this command but have no logic to perform right now.");
          console.log(`read ${args[0]}`);
        }
      }
    ]
  };

  return {
    init: () => {
      IFEngine.init(gameInfo);
    }
  };
})();

$(document).ready(function() {
  CloakOfDarkness.init();
});
