const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Given an absolute path to a .osu file, reads out the timing points
 * that indicate BPM changes
 *
 * See https://osu.ppy.sh/help/wiki/osu!_File_Formats/Osu_(file_format)
 *
 * @param {string} filePath An absolute path to a .osu file
 * @param {function} cb A function which will be called with the results
 *
 * @returns {Promise<string[]>} A promise resolving to a list of timing points
 */
function getTimingPoints(filePath) {
  if (!filePath) {
    console.log(
      "StreamCompanion did not send an osu! file to lookup. This can happen when osu! is closed."
    );
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filePath), "utf-8", (err, fileContents) => {
      if (err) return reject(err);

      const lines = fileContents.split(os.EOL);
      const fileFormatVersion = lines[0].match(/v(\d+)/)[1];

      const firstTimingPointIndex = lines.indexOf("[TimingPoints]") + 1;
      let allTimingPoints;
      for (let i = firstTimingPointIndex; i < lines.length; i++) {
        // All osu! file format versions separate sections with empty lines?
        // Also checking for the start of a new section to be safe
        if (lines[i].match(/^$/) || lines[i].startsWith("[")) {
          allTimingPoints = lines.slice(firstTimingPointIndex, i);
          break;
        }
      }

      const uninheritedTimingPoints = allTimingPoints.filter((timingPoint) => {
        const timingPointValues = timingPoint.split(",");
        if (fileFormatVersion >= 6) {
          // uninherited (0 or 1): Whether or not the timing point is uninherited
          const uninherited = timingPointValues[6];
          return uninherited == 1;
        }
        // v5 .osu files and below do not have "uninherited" flag
        const beatLength = timingPointValues[1];
        return beatLength > 0;
      });

      resolve(uninheritedTimingPoints);
    });
  });
}

module.exports = { getTimingPoints };