<?xml version="1.0" encoding="UTF-8"?>
<model ref="r:518a0de6-a00c-4267-9257-a293add4922d(ExampleLanguage.behavior)">
  <persistence version="9" />
  <languages>
    <use id="7866978e-a0f0-4cc7-81bc-4d213d9375e1" name="jetbrains.mps.lang.smodel" version="17" />
    <use id="af65afd8-f0dd-4942-87d9-63a55f2a9db1" name="jetbrains.mps.lang.behavior" version="2" />
    <devkit ref="fbc25dd2-5da4-483a-8b19-70928e1b62d7(jetbrains.mps.devkit.general-purpose)" />
  </languages>
  <imports>
    <import index="p7qg" ref="r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)" implicit="true" />
    <import index="tpck" ref="r:00000000-0000-4000-0000-011c89590288(jetbrains.mps.lang.core.structure)" implicit="true" />
    <import index="wyt6" ref="6354ebe7-c22a-4a0f-ac54-50b52ab9b065/java:java.lang(JDK/)" implicit="true" />
  </imports>
  <registry>
    <language id="af65afd8-f0dd-4942-87d9-63a55f2a9db1" name="jetbrains.mps.lang.behavior">
      <concept id="6496299201655527393" name="jetbrains.mps.lang.behavior.structure.LocalBehaviorMethodCall" flags="nn" index="BsUDl" />
      <concept id="1225194240794" name="jetbrains.mps.lang.behavior.structure.ConceptBehavior" flags="ng" index="13h7C7">
        <reference id="1225194240799" name="concept" index="13h7C2" />
        <child id="1225194240805" name="method" index="13h7CS" />
        <child id="1225194240801" name="constructor" index="13h7CW" />
      </concept>
      <concept id="1225194413805" name="jetbrains.mps.lang.behavior.structure.ConceptConstructorDeclaration" flags="in" index="13hLZK" />
      <concept id="1225194472830" name="jetbrains.mps.lang.behavior.structure.ConceptMethodDeclaration" flags="ng" index="13i0hz" />
      <concept id="1225194691553" name="jetbrains.mps.lang.behavior.structure.ThisNodeExpression" flags="nn" index="13iPFW" />
    </language>
    <language id="f3061a53-9226-4cc5-a443-f952ceaf5816" name="jetbrains.mps.baseLanguage">
      <concept id="1215693861676" name="jetbrains.mps.baseLanguage.structure.BaseAssignmentExpression" flags="nn" index="d038R">
        <child id="1068498886297" name="rValue" index="37vLTx" />
        <child id="1068498886295" name="lValue" index="37vLTJ" />
      </concept>
      <concept id="1202948039474" name="jetbrains.mps.baseLanguage.structure.InstanceMethodCallOperation" flags="nn" index="liA8E" />
      <concept id="1197027756228" name="jetbrains.mps.baseLanguage.structure.DotExpression" flags="nn" index="2OqwBi">
        <child id="1197027771414" name="operand" index="2Oq$k0" />
        <child id="1197027833540" name="operation" index="2OqNvi" />
      </concept>
      <concept id="1137021947720" name="jetbrains.mps.baseLanguage.structure.ConceptFunction" flags="in" index="2VMwT0">
        <child id="1137022507850" name="body" index="2VODD2" />
      </concept>
      <concept id="1068431474542" name="jetbrains.mps.baseLanguage.structure.VariableDeclaration" flags="ng" index="33uBYm">
        <child id="1068431790190" name="initializer" index="33vP2m" />
      </concept>
      <concept id="1068498886296" name="jetbrains.mps.baseLanguage.structure.VariableReference" flags="nn" index="37vLTw">
        <reference id="1068581517664" name="variableDeclaration" index="3cqZAo" />
      </concept>
      <concept id="1068498886294" name="jetbrains.mps.baseLanguage.structure.AssignmentExpression" flags="nn" index="37vLTI" />
      <concept id="1225271177708" name="jetbrains.mps.baseLanguage.structure.StringType" flags="in" index="17QB3L" />
      <concept id="4972933694980447171" name="jetbrains.mps.baseLanguage.structure.BaseVariableDeclaration" flags="ng" index="19Szcq">
        <child id="5680397130376446158" name="type" index="1tU5fm" />
      </concept>
      <concept id="1068580123132" name="jetbrains.mps.baseLanguage.structure.BaseMethodDeclaration" flags="ng" index="3clF44">
        <child id="1068580123133" name="returnType" index="3clF45" />
        <child id="1068580123135" name="body" index="3clF47" />
      </concept>
      <concept id="1068580123155" name="jetbrains.mps.baseLanguage.structure.ExpressionStatement" flags="nn" index="3clFbF">
        <child id="1068580123156" name="expression" index="3clFbG" />
      </concept>
      <concept id="1068580123136" name="jetbrains.mps.baseLanguage.structure.StatementList" flags="sn" stub="5293379017992965193" index="3clFbS">
        <child id="1068581517665" name="statement" index="3cqZAp" />
      </concept>
      <concept id="1068580320020" name="jetbrains.mps.baseLanguage.structure.IntegerConstant" flags="nn" index="3cmrfG">
        <property id="1068580320021" name="value" index="3cmrfH" />
      </concept>
      <concept id="1068581242875" name="jetbrains.mps.baseLanguage.structure.PlusExpression" flags="nn" index="3cpWs3" />
      <concept id="1068581242878" name="jetbrains.mps.baseLanguage.structure.ReturnStatement" flags="nn" index="3cpWs6">
        <child id="1068581517676" name="expression" index="3cqZAk" />
      </concept>
      <concept id="1068581242864" name="jetbrains.mps.baseLanguage.structure.LocalVariableDeclarationStatement" flags="nn" index="3cpWs8">
        <child id="1068581242865" name="localVariableDeclaration" index="3cpWs9" />
      </concept>
      <concept id="1068581242863" name="jetbrains.mps.baseLanguage.structure.LocalVariableDeclaration" flags="nr" index="3cpWsn" />
      <concept id="1068581517677" name="jetbrains.mps.baseLanguage.structure.VoidType" flags="in" index="3cqZAl" />
      <concept id="1204053956946" name="jetbrains.mps.baseLanguage.structure.IMethodCall" flags="ng" index="1ndlxa">
        <reference id="1068499141037" name="baseMethodDeclaration" index="37wK5l" />
        <child id="1068499141038" name="actualArgument" index="37wK5m" />
      </concept>
      <concept id="1081773326031" name="jetbrains.mps.baseLanguage.structure.BinaryOperation" flags="nn" index="3uHJSO">
        <child id="1081773367579" name="rightExpression" index="3uHU7w" />
        <child id="1081773367580" name="leftExpression" index="3uHU7B" />
      </concept>
      <concept id="1178549954367" name="jetbrains.mps.baseLanguage.structure.IVisible" flags="ng" index="1B3ioH">
        <child id="1178549979242" name="visibility" index="1B3o_S" />
      </concept>
      <concept id="1146644602865" name="jetbrains.mps.baseLanguage.structure.PublicVisibility" flags="nn" index="3Tm1VV" />
    </language>
    <language id="7866978e-a0f0-4cc7-81bc-4d213d9375e1" name="jetbrains.mps.lang.smodel">
      <concept id="1177026924588" name="jetbrains.mps.lang.smodel.structure.RefConcept_Reference" flags="nn" index="chp4Y">
        <reference id="1177026940964" name="conceptDeclaration" index="cht4Q" />
      </concept>
      <concept id="1138411891628" name="jetbrains.mps.lang.smodel.structure.SNodeOperation" flags="nn" index="eCIE_">
        <child id="1144104376918" name="parameter" index="1xVPHs" />
      </concept>
      <concept id="1171407110247" name="jetbrains.mps.lang.smodel.structure.Node_GetAncestorOperation" flags="nn" index="2Xjw5R" />
      <concept id="1144101972840" name="jetbrains.mps.lang.smodel.structure.OperationParm_Concept" flags="ng" index="1xMEDy">
        <child id="1207343664468" name="conceptArgument" index="ri$Ld" />
      </concept>
      <concept id="1138055754698" name="jetbrains.mps.lang.smodel.structure.SNodeType" flags="in" index="3Tqbb2">
        <reference id="1138405853777" name="concept" index="ehGHo" />
      </concept>
      <concept id="1138056022639" name="jetbrains.mps.lang.smodel.structure.SPropertyAccess" flags="nn" index="3TrcHB">
        <reference id="1138056395725" name="property" index="3TsBF5" />
      </concept>
    </language>
    <language id="ceab5195-25ea-4f22-9b92-103b95ca8c0c" name="jetbrains.mps.lang.core">
      <concept id="1169194658468" name="jetbrains.mps.lang.core.structure.INamedConcept" flags="ng" index="TrEIO">
        <property id="1169194664001" name="name" index="TrG5h" />
      </concept>
    </language>
  </registry>
  <node concept="13h7C7" id="6uy13ANHEEv">
    <ref role="13h7C2" to="p7qg:6uy13ANHtZw" resolve="Project" />
    <node concept="13i0hz" id="6uy13ANHETh" role="13h7CS">
      <property role="TrG5h" value="standardID" />
      <node concept="3Tm1VV" id="6uy13ANHETi" role="1B3o_S" />
      <node concept="17QB3L" id="6uy13ANHEX6" role="3clF45" />
      <node concept="3clFbS" id="6uy13ANHETk" role="3clF47">
        <node concept="3cpWs8" id="6uy13ANHGms" role="3cqZAp">
          <node concept="3cpWsn" id="6uy13ANHGmv" role="3cpWs9">
            <property role="TrG5h" value="client" />
            <node concept="3Tqbb2" id="6uy13ANHGmn" role="1tU5fm">
              <ref role="ehGHo" to="p7qg:6uy13ANHuh8" resolve="Client" />
            </node>
            <node concept="2OqwBi" id="6uy13ANHH1p" role="33vP2m">
              <node concept="13iPFW" id="6uy13ANHGO8" role="2Oq$k0" />
              <node concept="2Xjw5R" id="6uy13ANHHdd" role="2OqNvi">
                <node concept="1xMEDy" id="6uy13ANHHdf" role="1xVPHs">
                  <node concept="chp4Y" id="6uy13ANHHfw" role="ri$Ld">
                    <ref role="cht4Q" to="p7qg:6uy13ANHuh8" resolve="Client" />
                  </node>
                </node>
              </node>
            </node>
          </node>
        </node>
        <node concept="3cpWs8" id="6uy13ANHK5D" role="3cqZAp">
          <node concept="3cpWsn" id="6uy13ANHK5E" role="3cpWs9">
            <property role="TrG5h" value="clientPart" />
            <node concept="17QB3L" id="6uy13ANHK5C" role="1tU5fm" />
            <node concept="2OqwBi" id="6uy13ANHJuF" role="33vP2m">
              <node concept="2OqwBi" id="6uy13ANHHWi" role="2Oq$k0">
                <node concept="2OqwBi" id="6uy13ANHHsg" role="2Oq$k0">
                  <node concept="37vLTw" id="6uy13ANHHk4" role="2Oq$k0">
                    <ref role="3cqZAo" node="6uy13ANHGmv" resolve="client" />
                  </node>
                  <node concept="3TrcHB" id="6uy13ANHHC4" role="2OqNvi">
                    <ref role="3TsBF5" to="tpck:h0TrG11" resolve="name" />
                  </node>
                </node>
                <node concept="liA8E" id="6uy13ANHIfD" role="2OqNvi">
                  <ref role="37wK5l" to="wyt6:~String.substring(int,int)" resolve="substring" />
                  <node concept="3cmrfG" id="6uy13ANHInP" role="37wK5m">
                    <property role="3cmrfH" value="0" />
                  </node>
                  <node concept="3cmrfG" id="6uy13ANHJdd" role="37wK5m">
                    <property role="3cmrfH" value="2" />
                  </node>
                </node>
              </node>
              <node concept="liA8E" id="6uy13ANHJSM" role="2OqNvi">
                <ref role="37wK5l" to="wyt6:~String.toUpperCase()" resolve="toUpperCase" />
              </node>
            </node>
          </node>
        </node>
        <node concept="3cpWs8" id="6uy13ANHKjT" role="3cqZAp">
          <node concept="3cpWsn" id="6uy13ANHKjW" role="3cpWs9">
            <property role="TrG5h" value="projectPart" />
            <node concept="17QB3L" id="6uy13ANHKjR" role="1tU5fm" />
            <node concept="2OqwBi" id="6uy13ANHKNj" role="33vP2m">
              <node concept="2OqwBi" id="6uy13ANHKNk" role="2Oq$k0">
                <node concept="2OqwBi" id="6uy13ANHKNl" role="2Oq$k0">
                  <node concept="13iPFW" id="6uy13ANHKSa" role="2Oq$k0" />
                  <node concept="3TrcHB" id="6uy13ANHKNn" role="2OqNvi">
                    <ref role="3TsBF5" to="tpck:h0TrG11" resolve="name" />
                  </node>
                </node>
                <node concept="liA8E" id="6uy13ANHKNo" role="2OqNvi">
                  <ref role="37wK5l" to="wyt6:~String.substring(int,int)" resolve="substring" />
                  <node concept="3cmrfG" id="6uy13ANHKNp" role="37wK5m">
                    <property role="3cmrfH" value="0" />
                  </node>
                  <node concept="3cmrfG" id="6uy13ANHKNq" role="37wK5m">
                    <property role="3cmrfH" value="2" />
                  </node>
                </node>
              </node>
              <node concept="liA8E" id="6uy13ANHKNr" role="2OqNvi">
                <ref role="37wK5l" to="wyt6:~String.toUpperCase()" resolve="toUpperCase" />
              </node>
            </node>
          </node>
        </node>
        <node concept="3cpWs6" id="6uy13ANHL4v" role="3cqZAp">
          <node concept="3cpWs3" id="6uy13ANHLE$" role="3cqZAk">
            <node concept="37vLTw" id="6uy13ANHLKO" role="3uHU7w">
              <ref role="3cqZAo" node="6uy13ANHKjW" resolve="projectPart" />
            </node>
            <node concept="37vLTw" id="6uy13ANHLeZ" role="3uHU7B">
              <ref role="3cqZAo" node="6uy13ANHK5E" resolve="clientPart" />
            </node>
          </node>
        </node>
      </node>
    </node>
    <node concept="13i0hz" id="6uy13ANHEIb" role="13h7CS">
      <property role="TrG5h" value="assignStandardID" />
      <node concept="3Tm1VV" id="6uy13ANHEIc" role="1B3o_S" />
      <node concept="3cqZAl" id="6uy13ANHELW" role="3clF45" />
      <node concept="3clFbS" id="6uy13ANHEIe" role="3clF47">
        <node concept="3clFbF" id="6uy13ANHF4s" role="3cqZAp">
          <node concept="37vLTI" id="6uy13ANHFSo" role="3clFbG">
            <node concept="BsUDl" id="6uy13ANHFWs" role="37vLTx">
              <ref role="37wK5l" node="6uy13ANHETh" resolve="standardID" />
            </node>
            <node concept="2OqwBi" id="6uy13ANHFck" role="37vLTJ">
              <node concept="13iPFW" id="6uy13ANHF4r" role="2Oq$k0" />
              <node concept="3TrcHB" id="6uy13ANHFO7" role="2OqNvi">
                <ref role="3TsBF5" to="p7qg:6uy13ANH$AL" resolve="id" />
              </node>
            </node>
          </node>
        </node>
      </node>
    </node>
    <node concept="13hLZK" id="6uy13ANHEEw" role="13h7CW">
      <node concept="3clFbS" id="6uy13ANHEEx" role="2VODD2" />
    </node>
  </node>
</model>

