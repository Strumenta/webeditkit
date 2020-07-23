import h from 'snabbdom/h';

import { HttpCommunication } from '../internal';
import { ModelNode, Ref } from '../internal';
import {
  childCell,
  editableCell,
  fixedCell,
  horizontalCollectionCell,
  horizontalGroupCell,
  IData,
  referenceCell,
  row,
  verticalCollectionCell,
  verticalGroupCell,
} from '../internal';
import { Renderer } from '../internal';
import { horizontalLine } from '../internal';

/*
 We get the editor definition from MPS and generate a renderer out of it.
 */
export function generateRendererFromMPSEditor(
  data: IData,
  httpCommunication: HttpCommunication,
): (node: ModelNode) => Renderer {
  return (node: ModelNode) => generateRendererFromMPSEditorUsingConcept(data, httpCommunication, node.conceptName());
}

function cellToRenderer(data: IData, cellModel: ModelNode): Renderer {
  if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_Collection') {
    const childrenRenderers: Renderer[] = cellModel
      .childrenByLinkName('childCellModel')
      .map((cm) => cellToRenderer(data, cm));
    if ((cellModel.property('vertical') as boolean) || (cellModel.property('gridLayout') as boolean)) {
      return (modelNode) => verticalGroupCell(...childrenRenderers.map((r) => row(r(modelNode))));
    } else {
      return (modelNode) => horizontalGroupCell(...childrenRenderers.map((r) => r(modelNode)));
    }
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_Constant') {
    return (modelNode) => fixedCell(modelNode, cellModel.property('text') as string);
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_RefCell') {
    const ref = cellModel.ref('relationDeclaration') as Ref;
    const refData = ref.syncLoadData();
    return (modelNode) => referenceCell(modelNode, refData.name() as string);
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_Component') {
    const ref = cellModel.ref('editorComponent') as Ref;
    const refData = ref.syncLoadData();
    if (refData.name() === 'alias') {
      return (modelNode) =>
        fixedCell(modelNode, modelNode.alias == null ? modelNode.simpleConceptName() : modelNode.alias);
    } else {
      if (refData.conceptName() === 'jetbrains.mps.lang.editor.EditorComponentDeclaration') {
        return cellToRenderer(data, refData.childByLinkName('cellModel') as ModelNode);
      } else {
        console.log('should load component', refData.name(), refData);
      }
    }
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_RefNodeList') {
    const ref = cellModel.ref('relationDeclaration') as Ref;
    const refData = ref.syncLoadData();
    if ((cellModel.property('vertical') as boolean) || (cellModel.property('gridLayout') as boolean)) {
      return (modelNode) => verticalCollectionCell(modelNode, refData.name() as string);
    } else {
      return (modelNode) => horizontalCollectionCell(modelNode, refData.name() as string);
    }
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_RefNode') {
    const ref = cellModel.ref('relationDeclaration') as Ref;
    const refData = ref.syncLoadData();
    return (modelNode) => childCell(modelNode, refData.name() as string);
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_Property') {
    const ref = cellModel.ref('relationDeclaration') as Ref;
    const refData = ref.syncLoadData();
    return (modelNode) => editableCell(data, modelNode, refData.name() as string);
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_ReadOnlyModelAccessor') {
    return (modelNode) => fixedCell(modelNode, '???');
  } else if (cellModel.conceptName() === 'com.mbeddr.mpsutil.grammarcells.OptionalCell') {
    return cellToRenderer(data, cellModel.childByLinkName('option') as ModelNode);
  } else if (cellModel.conceptName() === 'com.mbeddr.mpsutil.grammarcells.GrammarInfoCell') {
    return cellToRenderer(data, cellModel.childByLinkName('projection') as ModelNode);
  } else if (cellModel.conceptName() === 'com.mbeddr.mpsutil.grammarcells.WrapperCell') {
    return cellToRenderer(data, cellModel.childByLinkName('wrapped') as ModelNode);
  } else if (cellModel.conceptName() === 'com.mbeddr.mpsutil.grammarcells.FlagCell') {
    const ref = cellModel.ref('relationDeclaration') as Ref;
    const refData = ref.syncLoadData();
    const propertyName = refData.name() as string;
    return (modelNode) => {
      if (modelNode.property(propertyName) as boolean) {
        return fixedCell(modelNode, propertyName);
      } else {
        return fixedCell(modelNode, '');
      }
    };
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_JComponent') {
    return (modelNode) => h('span', { style: { backgroundColor: 'red' } }, [`JComponent`]);
  } else if (cellModel.conceptName() === 'jetbrains.mps.lang.editor.CellModel_ContextAssistant') {
    return (modelNode) => fixedCell(modelNode, '');
  } else if (cellModel.conceptName() === 'de.itemis.mps.editor.celllayout.HorizontalLineCell') {
    return (modelNode) => horizontalLine();
  }
  console.log('cellToRenderer', cellModel.data);
  return (modelNode) =>
    h('span', { style: { backgroundColor: 'red' } }, [`unsupported cell ${cellModel.conceptName()}`]);
}

const renderersCache: { [key: string]: Renderer } = {};

export function generateRendererFromMPSEditorUsingConcept(
  data: IData,
  httpCommunication: HttpCommunication,
  conceptName: string,
): Renderer {
  if (!(conceptName in renderersCache)) {
    renderersCache[conceptName] = generateRendererFromMPSEditorUsingConceptImpl(data, httpCommunication, conceptName);
  }
  return renderersCache[conceptName];
}

function generateRendererFromMPSEditorUsingConceptImpl(
  data: IData,
  httpCommunication: HttpCommunication,
  conceptName: string,
): Renderer {
  const cellModel = httpCommunication.getMpsEditor(conceptName);
  if (cellModel != null) {
    return cellToRenderer(data, cellModel);
  }
  return (modelNode) => h('span', { style: { backgroundColor: 'red' } }, [`<generated renderer for ${conceptName}>`]);
}
