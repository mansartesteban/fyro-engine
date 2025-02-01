let sceneAddSquare = new Command(
  "square",
  (args, stream) => {
    console.log("ehre???");
    stream.log("Adding square !");
  },
  { help: "Add a square and a root" }
).addOption(["p", "path"], "Ajoute un chemin");

let sceneAddCircle = new Command(
  "circle",
  (args, stream) => {
    stream.log(JSON.stringify(args), "Adding circle !");
  },
  { help: "Add a circle of the life" }
);

let sceneAddCube = new Command(
  "cube",
  (args, stream) => {
    stream.log("Adding cube !");
  },
  { help: "Add a tiny cube !" }
);

let sceneAdd = new Command(
  "add",
  [sceneAddCircle, sceneAddCube, sceneAddSquare],
  { help: "Permits to add object on-the-fly" }
);
let sceneRemove = new Command("remove", (args, stream) => {
  if (args.includes("--all")) {
    stream.log("Everything has been removed");
  } else {
    stream.warning("something needs to be removed");
  }
});

let scene = new Command("scene", [sceneAdd, sceneRemove], {
  help: "A bundla about the scene, not to beocme an artist :)",
}).addOption("option", "o", "Ajoute une option");

let engineAdd = new Command("stop", (args, stream) => {
  stream.error("Engine cannot be stopped");
  return new Promise((r) => setTimeout(r(), 2000));
});

let engine = new Command("engine", [engineAdd], {
  help: "All commands relying to engine core",
});

Console.register([scene, engine]);
// OR
Console.register(scene).register(engine);
