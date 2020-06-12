import { expect } from 'chai';
import 'mocha';
import { Server, WebSocket } from 'mock-socket';
import { WsCommunication } from '../src/communication/wscommunication';
import { clearRendererRegistry } from '../src/presentation/renderer';
import { assertTheseMessagesAreReceived, clone } from './testutils';
import { clearDatamodelRoots, dataToNode, setDatamodelRoot } from '../src/datamodel/registry';
import { AnswerPropertyChange, PropertyChangeNotification, RequestPropertyChange } from '../src/communication/messages';

const rootData1 = {
  children: [
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547702',
          },
          concept: 'com.strumenta.financialcalc.BooleanType',
          abstractConcept: false,
        },
      ],
      properties: {
        name: 'a',
      },
      refs: {},
      id: {
        regularId: '1848360241685547698',
      },
      name: 'a',
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
    },
    {
      containingLink: 'inputs',
      children: [
        {
          containingLink: 'type',
          children: [],
          properties: {},
          refs: {},
          id: {
            regularId: '1848360241685547711',
          },
          concept: 'com.strumenta.financialcalc.StringType',
          abstractConcept: false,
        },
      ],
      properties: {
        name: 'b',
      },
      refs: {},
      id: {
        regularId: '1848360241685547705',
      },
      name: 'b',
      concept: 'com.strumenta.financialcalc.Input',
      abstractConcept: false,
    },
  ],
  properties: {
    name: 'My calculations',
  },
  refs: {},
  id: {
    regularId: '324292001770075100',
  },
  name: 'My calculations',
  concept: 'com.strumenta.financialcalc.FinancialCalcSheet',
  abstractConcept: false,
};

describe('WsCommunication', () => {
  let mockServer: Server | undefined = undefined;

  afterEach(() => {
    if (mockServer != null) {
      mockServer.close();
      mockServer = undefined;
    }
  });

  it('should register for changes on start', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
        mockServer.close();
        done();
      });
    });

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
  });

  it('should throw error for unknown messages', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
      });
      expect(() => {
        socket.send(JSON.stringify({ type: 'unknownMessageType' }));
      }).to.throw('Unknown message type: unknownMessageType');
      mockServer.close();
      done();
    });

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
  });

  it('should support instantiate', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'instantiateConcept',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'instantiateConcept',
                modelName: 'my.qualified.ModelName',
                conceptToInstantiate: 'myConcept',
                nodeToReplace: '1848360241685547698',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length === 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.instantiate('myConcept', n_a);
  });

  it('should support addChild', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];

    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'addChild',
            check: (msg) => {
              delete msg['requestId'];
              expect(msg).to.eql({
                type: 'addChild',
                modelName: 'my.qualified.ModelName',
                container: '1848360241685547698',
                containmentName: 'type',
                conceptToInstantiate: 'my.concept.ToInstantiate',
                index: -1,
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.addChild(n_a, 'type', 'my.concept.ToInstantiate');
  });

  it('should support addChildAtIndex', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'addChild',
            check: (msg) => {
              delete msg['requestId'];
              expect(msg).to.eql({
                type: 'addChild',
                modelName: 'my.qualified.ModelName',
                container: '1848360241685547698',
                containmentName: 'type',
                conceptToInstantiate: 'my.concept.ToInstantiate',
                index: 2,
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.addChildAtIndex(n_a, 'type', 2, 'my.concept.ToInstantiate');
  });

  it('should support setChild', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'setChild',
            check: (msg) => {
              delete msg['requestId'];
              expect(msg).to.eql({
                type: 'setChild',
                modelName: 'my.qualified.ModelName',
                container: '1848360241685547698',
                containmentName: 'type',
                conceptToInstantiate: 'my.concept.ToInstantiate',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.setChild(n_a, 'type', 'my.concept.ToInstantiate');
  });

  it('should support deleteNode', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'deleteNode',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'deleteNode',
                modelName: 'my.qualified.ModelName',
                node: '1848360241685547698',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.deleteNode(n_a);
  });

  it('should support insertNextSibling', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'insertNextSibling',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'insertNextSibling',
                modelName: 'my.qualified.ModelName',
                sibling: '1848360241685547698',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          mockServer.close();
          done();
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.insertNextSibling(n_a);
  });

  describe('triggerChangeOnPropertyNode', () => {
    it('should send messages to server', (done) => {
      const fakeURL = 'ws://localhost:8080';
      mockServer = new Server(fakeURL);

      const messagesReceivedByServer = [];
      const receivedArray = [false, false];

      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          messagesReceivedByServer.push(JSON.parse(data as string));
          assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
            {
              type: 'propertyChange',
              check: (msg) => {
                expect(msg).to.eql({
                  type: 'propertyChange',
                  node: {
                    model: 'my.qualified.ModelName',
                    id: {
                      regularId: '1848360241685547698',
                    },
                  },
                  propertyName: 'name',
                  propertyValue: 'my new name',
                  requestId: 'request ID',
                } as RequestPropertyChange);
              },
            },
            {
              type: 'registerForChanges',
              check: (msg) => {
                expect(msg).to.eql({
                  type: 'registerForChanges',
                  modelName: 'my.qualified.ModelName',
                });
              },
            },
          ]);
          if (messagesReceivedByServer.length == 2) {
            mockServer.close();
            done();
          }
        });
      });

      const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
      ws.setSilent();
      const root = dataToNode(clone(rootData1));
      root.injectModelName('my.qualified.ModelName', 'myRoot');
      const n_a = root.findNodeById('1848360241685547698');
      ws.triggerChangeOnPropertyNode(n_a, 'name', 'my new name', undefined, 'request ID');
    });

    it('should invoke callback on reply', (done) => {
      const fakeURL = 'ws://localhost:8080';
      mockServer = new Server(fakeURL);
      mockServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          socket.send(
            JSON.stringify({ type: 'AnswerPropertyChange', requestId: 'request ID' } as AnswerPropertyChange),
          );
        });
      });
      const ws = new WsCommunication(fakeURL, 'my.qualified.ModelName', 'localName');
      ws.setSilent();

      const root = dataToNode(clone(rootData1));
      root.injectModelName('my.qualified.ModelName', 'myRoot');
      const node = root.findNodeById('1848360241685547698');
      ws.triggerChangeOnPropertyNode(
        node,
        'name',
        'my new name which is fantastic',
        () => {
          mockServer.close();
          done();
        },
        'request ID',
      );
    });
  });

  it('should support triggerDefaultInsertion', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    const uuid = '12345678-1234-4444-9876-123456789012';
    const newNodeId = '123456';

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'defaultInsertion',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'defaultInsertion',
                modelName: 'my.qualified.ModelName',
                container: '1848360241685547698',
                requestId: uuid,
                containmentName: 'type',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          socket.send(
            JSON.stringify({
              type: 'AnswerDefaultInsertion',
              requestId: uuid,
              addedNodeID: {
                regularId: newNodeId,
              },
            }),
          );
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.triggerDefaultInsertion(
      n_a,
      'type',
      (addedNodeID) => {
        expect(addedNodeID).to.eql({ regularId: newNodeId });
        mockServer.close();
        done();
      },
      uuid,
    );
  });

  it('should support askAlternatives', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    const messagesReceivedByServer = [];
    const receivedArray = [false, false];

    const uuid = '12345678-1234-4444-9876-123456789012';
    const newNodeId = '123456';

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        messagesReceivedByServer.push(JSON.parse(data as string));
        assertTheseMessagesAreReceived(receivedArray, messagesReceivedByServer.length, data as string, [
          {
            type: 'askAlternatives',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'askAlternatives',
                modelName: 'my.qualified.ModelName',
                nodeId: '1848360241685547698',
                requestId: uuid,
                containmentName: 'type',
              });
            },
          },
          {
            type: 'registerForChanges',
            check: (msg) => {
              expect(msg).to.eql({
                type: 'registerForChanges',
                modelName: 'my.qualified.ModelName',
              });
            },
          },
        ]);
        if (messagesReceivedByServer.length == 2) {
          socket.send(
            JSON.stringify({
              type: 'AnswerAlternatives',
              requestId: uuid,
              items: [
                { conceptName: 'my.concept.A', alias: 'foo' },
                { conceptName: 'my.concept.B', alias: 'zum' },
                { conceptName: 'my.concept.C', alias: 'bar' },
              ],
            }),
          );
        }
      });
    });

    const ws = new WsCommunication('myurl', 'my.qualified.ModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    const n_a = root.findNodeById('1848360241685547698');
    ws.askAlternatives(
      n_a,
      'type',
      (alternatives) => {
        expect(alternatives).to.deep.equal([
          { conceptName: 'my.concept.A', alias: 'foo' },
          { conceptName: 'my.concept.B', alias: 'zum' },
          { conceptName: 'my.concept.C', alias: 'bar' },
        ]);
        mockServer.close();
        done();
      },
      uuid,
    );
  });

  it('should react to property change by updating the property - on root', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    clearDatamodelRoots();
    clearRendererRegistry();
    // @ts-ignore
    delete global.$;
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.document;

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
      });
      try {
        socket.send(
          JSON.stringify({
            type: 'PropertyChange',
            node: {
              model: 'myModelName',
              id: { regularId: '324292001770075100' },
            },
            propertyName: 'name',
            propertyValue: 'My Shiny New Name',
          } as PropertyChangeNotification),
        );
        expect(root.name()).to.equals('My Shiny New Name');
        mockServer.close();
        done();
      } catch (e) {
        mockServer.close();
        throw e;
      }
    });

    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    setDatamodelRoot('localName', root);

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
  });

  it('should react to node added - to unexisting parent', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
      });
      expect(() => {
        socket.send(
          JSON.stringify({
            type: 'nodeAdded',
            parentNodeId: { regularId: '1848360241685575188' },
            child: {
              containingLink: 'type',
              children: [],
              properties: {},
              refs: {},
              id: { regularId: '1848360241685575208' },
              concept: 'com.strumenta.financialcalc.BooleanType',
              abstractConcept: false,
            },
            index: 0,
            relationName: 'type',
          }),
        );
      }).to.throw('Cannot add node because parent was not found. ID was: {"regularId":"1848360241685575188"}');
      mockServer.close();
      done();
    });

    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    setDatamodelRoot('localName', root);

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
  });

  it('should react to node added - to existing parent', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    mockServer.on('connection', (socket) => {
      try {
        socket.on('message', (data) => {
          expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
        });
        socket.send(
          JSON.stringify({
            type: 'nodeAdded',
            parentNodeId: { regularId: '1848360241685547711' },
            child: {
              containingLink: 'type',
              children: [],
              properties: {},
              refs: {},
              id: { regularId: '1848360241685575208' },
              concept: 'com.strumenta.financialcalc.BooleanType',
              abstractConcept: false,
            },
            index: 0,
            relationName: 'type',
          }),
        );
        expect(n_b.childrenByLinkName('type').length).to.equals(1);
        mockServer.close();
        done();
      } catch (e) {
        mockServer.close();
        throw e;
      }
    });

    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    setDatamodelRoot('localName', root);
    const n_b = root.findNodeById('1848360241685547711');
    expect(n_b.childrenByLinkName('type').length).to.equals(0);

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
  });

  it('should react to node removed - to existing parent', (done) => {
    const fakeURL = 'ws://localhost:8080';
    mockServer = new Server(fakeURL);

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(JSON.parse(data as string)).to.eql({ type: 'registerForChanges', modelName: 'myModelName' });
      });
      socket.send(
        JSON.stringify({
          type: 'nodeRemoved',
          parentNodeId: { regularId: '1848360241685547698' },
          child: {
            containingLink: 'type',
            children: [],
            properties: {},
            refs: {},
            id: {
              regularId: '1848360241685547702',
            },
            concept: 'com.strumenta.financialcalc.BooleanType',
            abstractConcept: false,
          },
          index: 0,
          relationName: 'type',
        }),
      );
      expect(n_a.childrenByLinkName('type').length).to.equals(0);
      mockServer.close();
      done();
    });

    const root = dataToNode(clone(rootData1));
    root.injectModelName('my.qualified.ModelName', 'myRoot');
    setDatamodelRoot('localName', root);
    const n_a = root.findNodeById('1848360241685547698');
    expect(n_a.childrenByLinkName('type').length).to.equals(1);

    const ws = new WsCommunication('myurl', 'myModelName', 'localName', new WebSocket(fakeURL));
    ws.setSilent();
  });
});
