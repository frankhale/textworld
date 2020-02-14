import * as _ from "lodash";
import { Room } from "./types";

/**
 * A two dimensional array which represents a portion of the game map
 *
 * @param width - The width of the matrix
 * @param height - The height of the matrix
 * @returns A two dimensional array initialized with zeros
 */
export function createMatrix(width: number, height: number): number[][] {
  return _.map(_.range(0, height), x => {
    return _.map(_.range(0, width), i => {
      return 0;
    });
  });
}

/**
 * This plots the rooms ID into a 2D matrix.
 *
 * @param data - The room data
 * @param startX - The starting X position for plotting the first room
 * @param startY - The starting Y position for plotting the first room
 * @param width - The width of the map
 * @param height - The height of the map
 * @returns A two dimensional array with the room ID's plotted
 */
export function plotMap(
  data: Room[],
  startX: number,
  startY: number,
  width: number,
  height: number
) {
  let result = createMatrix(width, height);

  function plotPoint(data: Room[], id: number, x: number, y: number, map: number[][]) {
    if (id === 0) return;

    let r = _.find(data, { id: id });

    if (r && r.x !== -1 && r.y !== -1) {
      r.x = x;
      r.y = y;
      map[r.y][r.x] = r.id;
    }
  }

  _.forEach(data, d => {
    if (!d.x && !d.y) {
      // Plot our starting point which is the first item in
      // our data array
      d.x = startX;
      d.y = startY;
      result[startY][startX] = data[0].id;
    }

    // isolated means all exits add up to zero (eg. no exits)
    let isolated = _.reduce(
      d.exits,
      function(sum, n) {
        return sum + n;
      },
      0
    );

    if (isolated > 0) {
      plotPoint(data, d.exits[0], d.x, d.y - 1, result);
      plotPoint(data, d.exits[1], d.x, d.y + 1, result);
      plotPoint(data, d.exits[2], d.x + 1, d.y, result);
      plotPoint(data, d.exits[3], d.x - 1, d.y, result);
    }
    // isolated points need to have an explicit x,y values for plotting
    else if (!d.x && !d.y) {
      result[d.y][d.x] = d.id;
    }
  });

  return result;
}

/**
 * Renders a plotted map into a string representation.
 *
 * @param map - The map with it's corresponding room IDs plotted
 * @returns - A string representation of the map
 */
export function renderTextMap(map: number[][]) {
  let result: string[] = [];

  _.forEach(map, row => {
    let rowOut: string[] = [];
    _.forEach(row, cell => {
      if (cell === 0) {
        rowOut.push(".");
      } else {
        rowOut.push(cell.toString());
      }
    });
    result.push(rowOut.join(""));
  });

  //console.log(result.join("\n"));
  return result.join("\n");
}
