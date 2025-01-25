import Application from "./Application/Application";
import Space from "@projects/Space";

Application.start().then(Application.loadProject(Space));

import "@app/Assets/Styles/reset.css";
import "@app/Assets/Styles/main.css";
