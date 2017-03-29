#!/usr/bin/env node
/**
 * Batch-convert SVG icons to PNG for multiple pixel densities.
 *
 * @param --input  [files]     Directory with SVGs to use as master files.
 * @param --output [directory] Output PNG directory. Exported files will match
 *                             structure of --input filepaths.
 * @param --watch  [boolean]   Watch for new files instead of batch in one go.
 *                             (optional)
 *
 * @example
 * Given that you have a file with the path:
 * /path/to/svgs/cool-icons/icon.svg
 *
 * The arguments "--input path/to/svgs/ --output path/to/pngs/"
 *
 * Will produce new files with the paths:
 * path/to/pngs/1x/cool-icons/icon.png
 * path/to/pngs/2x/cool-icons/icon.png
 * path/to/pngs/3x/cool-icons/icon.png
 */

const program = require('commander');
const glob = require('glob');
const svgexport = require('svgexport');
const watch = require('node-watch');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

/**
 * This is based on the assumption that SVG files are delivered on @2x base size.
 * If you are getting inconsistent bitmap sizes, check that your new SVGs are
 * roughly the same size as existing ones when opened in Illustrator.
 */
const SIZES = [
  {
    pixelDensity: '1x',
    baseScaleFactor: '0.5x',
  },
  {
    pixelDensity: '2x',
    baseScaleFactor: '1x',
  },
  {
    pixelDensity: '3x',
    baseScaleFactor: '2x',
  },
];

program
  .option('-i, --input [files]', 'Directory with SVGs to use as master files.')
  .option('-w, --watch', 'Watch for filesystem changes rather than batch.')
  .option('-o, --output [directory]', 'Directory with PNGs to export.')
  .parse(process.argv);

const getRelativePngPath = filePath => filePath.split(program.input)[1].replace('.svg', '.png');

function convertSvgToPngs(filePath) {
  const relativePngPath = getRelativePngPath(filePath);
  console.info(`Converting ${filePath}`);
  SIZES.forEach(function(size) {
    const outputPath = `${program.output}/${size.pixelDensity}/${relativePngPath}`;
    console.info(`Generating ${outputPath}`);
    svgexport.render([{
      input: filePath,
      output: `${outputPath} ${size.baseScaleFactor}`,
    }]);
  });
}

if (program.watch) {
  // Continually watch for new & deleted files & execute script only for these.
  watch(program.input, { recursive: true }, function(event, filePath) {
    if (event === 'update' && path.extname(filePath) === '.svg') {
      console.info(`${filePath} updated, generating bitmaps…`);
      convertSvgToPngs(filePath);
    }
    else if (event === 'remove') {
      // Destroy corresponding output files.
      console.info(`${filePath} deleted. Removing corresponding bitmaps…`);
      const relativePngPath = getRelativePngPath(filePath);
      SIZES.forEach(function(size) {
        const generatedPath = `${program.output}/${size.pixelDensity}/${relativePngPath}`;
        if (fs.existsSync(generatedPath)) {
          fs.unlinkSync(generatedPath);
          console.info(`${generatedPath} deleted.`);
        }
      });
    }
  });
}
else {
  // Begin by cleaning output directory.
  console.info(`Deleting all files & folders in ${program.output} …`);
  rimraf(`${program.output}/*`, {}, function() {
    console.info('… complete.');
    // And then batch-convert all SVG assets from input directory. Exit after.
    glob(`${program.input}**/*.svg`, {}, (error, matchedFiles) => matchedFiles.forEach(convertSvgToPngs));
  });
}
