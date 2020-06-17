import {
  editableCell,
  fixedCell, horizontalGroupCell,
  ModelNode,
  row,
  tabCell,
  verticalCollectionCell,
  verticalGroupCell,
} from 'webeditkit';
import { Data } from 'webeditkit/dist/presentation/cells';

require("./style.css");

const webeditkit = require('webeditkit');

const BASE_ADDRESS = "localhost:9000";
const MODEL_NAME = "ExampleLanguage.sandbox";
const ROOT_ID = "7467535778008416706";

webeditkit.setup();
webeditkit.setDefaultBaseUrl(BASE_ADDRESS);

const data = new Data();

webeditkit.registerRenderer('ExampleLanguage.Client', (node: ModelNode) => {
  return verticalGroupCell(
    row(fixedCell(node, "client"), editableCell(data, node, "name")),
    row(tabCell(), verticalCollectionCell(node, "projects"))
  );
});

webeditkit.registerRenderer('ExampleLanguage.Project', (node: ModelNode) => {
  return horizontalGroupCell(fixedCell(node, "Project ["),
    editableCell(data, node, "id"),
    fixedCell(node, "]"),
    editableCell(data, node, "name"),
  );
});

webeditkit.addModel(BASE_ADDRESS, MODEL_NAME, ROOT_ID, "main-editor");

// // Force reload of MPS model
// $.post(`${BASE_ADDRESS}/models/${MODEL_NAME}/reload`, {}, (data, textStatus) => {
//
// });