const execSync = require('child_process').exec;
const glob = require('glob');
const rimraf = require('rimraf');
const fs = require('fs');
const os = require('os');

describe('svg-converter', function() {
  const INPUT_DIR = 'test/fixtures';
  const OUTPUT_DIR = os.tmpdir();
  const TEST_COMMAND = `lib/index.js --input=${INPUT_DIR} --output=${OUTPUT_DIR}`;
  const SIZE_DIRS = ['1x', '2x', '3x'];
  const FILE_SIZES = [7214, 28511, 113576];
  let svgs;

  beforeEach(function(done) {
    svgs = glob.sync(`${INPUT_DIR}**/*.svg`, {});
    execSync(TEST_COMMAND, done);
  }, 10000); // This can take a while to spin up

  afterEach(function(done) {
    rimraf(`${OUTPUT_DIR}/*`, {}, done);
  });

  it('should generate a PNG for each predefined pixel density', function() {
    svgs.forEach(function(svgSource) {
      SIZE_DIRS.forEach(function(size) {
        // Should resolve to something like test/output/2x/behance.png
        const targetPngPath = `${OUTPUT_DIR}/${size}${svgSource.split(INPUT_DIR)[1].replace('.svg', '.png')}`;
        expect(fs.existsSync(targetPngPath)).toBe(true);
      });
    });
  });

  it('should generate consistent filesizes', function() {
    svgs.forEach(function(svgSource) {
      SIZE_DIRS.forEach(function(size, index) {
        const targetPngPath = `${OUTPUT_DIR}/${size}${svgSource.split(INPUT_DIR)[1].replace('.svg', '.png')}`;
        expect(fs.statSync(targetPngPath).size).toEqual(FILE_SIZES[index]);
      });
    });
  });
});
