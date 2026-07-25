const archiver = require("archiver");
const fs = require("fs");
const path = require("path")

const archive = new archiver.ZipArchive();
const output = fs.createWriteStream(path.join(__dirname, "redheader.zip"));

if (!fs.existsSync(path.join(__dirname, "dist"))) {
  console.log("run build first!!")
  process.exit(1)
}

output.on("close", () => {
  console.log("created archive");
  console.log("total bytes: " + archive.pointer());
});

archive.on("warning", (err) => {
  if (err.code == "ENOENT") {
    console.log(err);
  } else {
    throw err;
  }
});

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.directory("dist", false);
archive.finalize();
