<?xml version="1.0" encoding="UTF-8"?>
<model ref="r:a550b9c4-46d2-451c-905a-713398f611ff(ExampleLanguage.intentions)">
  <persistence version="9" />
  <languages>
    <use id="d7a92d38-f7db-40d0-8431-763b0c3c9f20" name="jetbrains.mps.lang.intentions" version="1" />
    <devkit ref="fbc25dd2-5da4-483a-8b19-70928e1b62d7(jetbrains.mps.devkit.general-purpose)" />
  </languages>
  <imports>
    <import index="p7qg" ref="r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)" implicit="true" />
    <import index="s0u7" ref="r:518a0de6-a00c-4267-9257-a293add4922d(ExampleLanguage.behavior)" implicit="true" />
  </imports>
  <registry>
    <language id="f3061a53-9226-4cc5-a443-f952ceaf5816" name="jetbrains.mps.baseLanguage">
      <concept id="1154032098014" name="jetbrains.mps.baseLanguage.structure.AbstractLoopStatement" flags="nn" index="2LF5Ji">
        <child id="1154032183016" name="body" index="2LFqv$" />
      </concept>
      <concept id="1197027756228" name="jetbrains.mps.baseLanguage.structure.DotExpression" flags="nn" index="2OqwBi">
        <child id="1197027771414" name="operand" index="2Oq$k0" />
        <child id="1197027833540" name="operation" index="2OqNvi" />
      </concept>
      <concept id="1137021947720" name="jetbrains.mps.baseLanguage.structure.ConceptFunction" flags="in" index="2VMwT0">
        <child id="1137022507850" name="body" index="2VODD2" />
      </concept>
      <concept id="1070475926800" name="jetbrains.mps.baseLanguage.structure.StringLiteral" flags="nn" index="Xl_RD">
        <property id="1070475926801" name="value" index="Xl_RC" />
      </concept>
      <concept id="1068580123155" name="jetbrains.mps.baseLanguage.structure.ExpressionStatement" flags="nn" index="3clFbF">
        <child id="1068580123156" name="expression" index="3clFbG" />
      </concept>
      <concept id="1068580123136" name="jetbrains.mps.baseLanguage.structure.StatementList" flags="sn" stub="5293379017992965193" index="3clFbS">
        <child id="1068581517665" name="statement" index="3cqZAp" />
      </concept>
      <concept id="1204053956946" name="jetbrains.mps.baseLanguage.structure.IMethodCall" flags="ng" index="1ndlxa">
        <reference id="1068499141037" name="baseMethodDeclaration" index="37wK5l" />
      </concept>
    </language>
    <language id="d7a92d38-f7db-40d0-8431-763b0c3c9f20" name="jetbrains.mps.lang.intentions">
      <concept id="1192794744107" name="jetbrains.mps.lang.intentions.structure.IntentionDeclaration" flags="ig" index="2S6QgY" />
      <concept id="1192794782375" name="jetbrains.mps.lang.intentions.structure.DescriptionBlock" flags="in" index="2S6ZIM" />
      <concept id="1192795911897" name="jetbrains.mps.lang.intentions.structure.ExecuteBlock" flags="in" index="2Sbjvc" />
      <concept id="1192796902958" name="jetbrains.mps.lang.intentions.structure.ConceptFunctionParameter_node" flags="nn" index="2Sf5sV" />
      <concept id="2522969319638091381" name="jetbrains.mps.lang.intentions.structure.BaseIntentionDeclaration" flags="ig" index="2ZfUlf">
        <property id="2522969319638091386" name="isAvailableInChildNodes" index="2ZfUl0" />
        <reference id="2522969319638198290" name="forConcept" index="2ZfgGC" />
        <child id="2522969319638198291" name="executeFunction" index="2ZfgGD" />
        <child id="2522969319638093993" name="descriptionFunction" index="2ZfVej" />
      </concept>
    </language>
    <language id="7866978e-a0f0-4cc7-81bc-4d213d9375e1" name="jetbrains.mps.lang.smodel">
      <concept id="1179409122411" name="jetbrains.mps.lang.smodel.structure.Node_ConceptMethodCall" flags="nn" index="2qgKlT" />
      <concept id="1138056282393" name="jetbrains.mps.lang.smodel.structure.SLinkListAccess" flags="nn" index="3Tsc0h">
        <reference id="1138056546658" name="link" index="3TtcxE" />
      </concept>
    </language>
    <language id="ceab5195-25ea-4f22-9b92-103b95ca8c0c" name="jetbrains.mps.lang.core">
      <concept id="1169194658468" name="jetbrains.mps.lang.core.structure.INamedConcept" flags="ng" index="TrEIO">
        <property id="1169194664001" name="name" index="TrG5h" />
      </concept>
    </language>
    <language id="83888646-71ce-4f1c-9c53-c54016f6ad4f" name="jetbrains.mps.baseLanguage.collections">
      <concept id="1153943597977" name="jetbrains.mps.baseLanguage.collections.structure.ForEachStatement" flags="nn" index="2Gpval">
        <child id="1153944400369" name="variable" index="2Gsz3X" />
        <child id="1153944424730" name="inputSequence" index="2GsD0m" />
      </concept>
      <concept id="1153944193378" name="jetbrains.mps.baseLanguage.collections.structure.ForEachVariable" flags="nr" index="2GrKxI" />
      <concept id="1153944233411" name="jetbrains.mps.baseLanguage.collections.structure.ForEachVariableReference" flags="nn" index="2GrUjf">
        <reference id="1153944258490" name="variable" index="2Gs0qQ" />
      </concept>
    </language>
  </registry>
  <node concept="2S6QgY" id="6uy13ANHDKa">
    <property role="TrG5h" value="AssignStandardIDsToAllProjects" />
    <property role="2ZfUl0" value="true" />
    <ref role="2ZfgGC" to="p7qg:6uy13ANHuh8" resolve="Client" />
    <node concept="2S6ZIM" id="6uy13ANHDKb" role="2ZfVej">
      <node concept="3clFbS" id="6uy13ANHDKc" role="2VODD2">
        <node concept="3clFbF" id="6uy13ANHE3k" role="3cqZAp">
          <node concept="Xl_RD" id="6uy13ANHEvS" role="3clFbG">
            <property role="Xl_RC" value="Assign Standard ID to All Projects" />
          </node>
        </node>
      </node>
    </node>
    <node concept="2Sbjvc" id="6uy13ANHDKd" role="2ZfgGD">
      <node concept="3clFbS" id="6uy13ANHDKe" role="2VODD2">
        <node concept="2Gpval" id="6uy13ANHMCT" role="3cqZAp">
          <node concept="2GrKxI" id="6uy13ANHMCU" role="2Gsz3X">
            <property role="TrG5h" value="p" />
          </node>
          <node concept="2OqwBi" id="6uy13ANHMUB" role="2GsD0m">
            <node concept="2Sf5sV" id="6uy13ANHMKE" role="2Oq$k0" />
            <node concept="3Tsc0h" id="6uy13ANHN6P" role="2OqNvi">
              <ref role="3TtcxE" to="p7qg:6uy13ANHvEB" resolve="projects" />
            </node>
          </node>
          <node concept="3clFbS" id="6uy13ANHMCW" role="2LFqv$">
            <node concept="3clFbF" id="6uy13ANHNb9" role="3cqZAp">
              <node concept="2OqwBi" id="6uy13ANHNj4" role="3clFbG">
                <node concept="2GrUjf" id="6uy13ANHNb8" role="2Oq$k0">
                  <ref role="2Gs0qQ" node="6uy13ANHMCU" resolve="p" />
                </node>
                <node concept="2qgKlT" id="6uy13ANHNwt" role="2OqNvi">
                  <ref role="37wK5l" to="s0u7:6uy13ANHEIb" resolve="assignStandardID" />
                </node>
              </node>
            </node>
          </node>
        </node>
      </node>
    </node>
  </node>
  <node concept="2S6QgY" id="6uy13ANHOUd">
    <property role="TrG5h" value="AssignStandardID" />
    <property role="2ZfUl0" value="true" />
    <ref role="2ZfgGC" to="p7qg:6uy13ANHtZw" resolve="Project" />
    <node concept="2S6ZIM" id="6uy13ANHOUe" role="2ZfVej">
      <node concept="3clFbS" id="6uy13ANHOUf" role="2VODD2">
        <node concept="3clFbF" id="6uy13ANHOUg" role="3cqZAp">
          <node concept="Xl_RD" id="6uy13ANHOUh" role="3clFbG">
            <property role="Xl_RC" value="Assign Standard ID" />
          </node>
        </node>
      </node>
    </node>
    <node concept="2Sbjvc" id="6uy13ANHOUi" role="2ZfgGD">
      <node concept="3clFbS" id="6uy13ANHOUj" role="2VODD2">
        <node concept="3clFbF" id="6uy13ANHOUq" role="3cqZAp">
          <node concept="2OqwBi" id="6uy13ANHOUr" role="3clFbG">
            <node concept="2qgKlT" id="6uy13ANHOUt" role="2OqNvi">
              <ref role="37wK5l" to="s0u7:6uy13ANHEIb" resolve="assignStandardID" />
            </node>
            <node concept="2Sf5sV" id="6uy13ANHPof" role="2Oq$k0" />
          </node>
        </node>
      </node>
    </node>
  </node>
</model>

