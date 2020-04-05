import { expect } from 'chai';
import 'mocha';
import { installAutoresize } from '../src/uiutils';
import { prepareFakeDom } from './testutils';

const html1 = `<html>
\t<body data-gr-c-s-loaded="true">
\t\t<div id="calc" class="editor">
\t\t\t<div class="vertical-group represent-node" data-node_represented="324292001770075100">
\t\t\t\t<div class="row">
\t\t\t\t\t<input class="fixed title" style="width: 120.875px;">
\t\t\t\t\t<input class="editable title" placeholder="<no name>" required="" style="width: 151.688px;">
\t\t\t\t</div>
\t\t\t\t<div class="row"></div>
\t\t\t\t<div class="row">
\t\t\t\t\t<input class="fixed strong">
\t\t\t\t</div>
\t\t\t\t<div class="row">
\t\t\t\t\t<div class="tab"></div>
\t\t\t\t\t<div class="vertical-collection represent-collection"data-relation_represented="inputs">
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685547698">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="">
\t\t\t\t\t\t\t\t<input class="fixed keyword">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685547702">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685575196">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="" style="width: 26.6px;" value="sdsd">
\t\t\t\t\t\t\t\t<input class="fixed keyword" style="width: 40.225px;">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685575206">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="row">
\t\t\t\t\t\t\t<div class="horizontal-group represent-node" data-node_represented="1848360241685547705">
\t\t\t\t\t\t\t\t<input class="editable" placeholder="<no name>" required="">
\t\t\t\t\t\t\t\t<input class="fixed keyword">
\t\t\t\t\t\t\t\t<input class="fixed type represent-node" data-node_represented="1848360241685547711">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</body>
</html>`;

describe('UIUtils', () => {
  it('should support installAutoresize', () => {
    const doc = prepareFakeDom(html1);

    const editableName_a = doc.querySelector('div[data-node_represented="1848360241685547698"] .editable');

    // check width
    expect(editableName_a.style.width).to.eql('');
    // install autoresize
    installAutoresize((text: string) => {
      if (text == null) {
        return 0;
      }
      return text.length * 8;
    });
    expect(editableName_a.style.width).to.eql('');
    // invoke autoresize
    // @ts-ignore
    $(editableName_a).autoresize();
    // placeholder: '<no name>' -> 9 chars * 8 + 10 for padding -> 82px
    expect(editableName_a.style.width).to.eql('82px');
    editableName_a.setAttribute('value', 'x');
    expect(editableName_a.style.width).to.eql('82px');
    // @ts-ignore
    $(editableName_a).autoresize();
    expect(editableName_a.style.width).to.eql('18px');
    editableName_a.setAttribute('value', 'xxx');
    expect(editableName_a.style.width).to.eql('18px');
    // @ts-ignore
    $(editableName_a).autoresize();
    expect(editableName_a.style.width).to.eql('34px');
    editableName_a.setAttribute('value', '');
    expect(editableName_a.style.width).to.eql('34px');
    // @ts-ignore
    $(editableName_a).autoresize();
    expect(editableName_a.style.width).to.eql('82px');
  });
});
