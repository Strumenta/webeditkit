<?xml version="1.0" encoding="UTF-8"?>
<model ref="r:7d057e37-4b53-4af6-8b82-44ac6390939b(ExampleLanguage.editor)">
  <persistence version="9" />
  <languages>
    <use id="18bc6592-03a6-4e29-a83a-7ff23bde13ba" name="jetbrains.mps.lang.editor" version="13" />
    <devkit ref="fbc25dd2-5da4-483a-8b19-70928e1b62d7(jetbrains.mps.devkit.general-purpose)" />
  </languages>
  <imports>
    <import index="p7qg" ref="r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)" implicit="true" />
    <import index="tpck" ref="r:00000000-0000-4000-0000-011c89590288(jetbrains.mps.lang.core.structure)" implicit="true" />
  </imports>
  <registry>
    <language id="18bc6592-03a6-4e29-a83a-7ff23bde13ba" name="jetbrains.mps.lang.editor">
      <concept id="1071666914219" name="jetbrains.mps.lang.editor.structure.ConceptEditorDeclaration" flags="ig" index="24kQdi" />
      <concept id="1140524381322" name="jetbrains.mps.lang.editor.structure.CellModel_ListWithRole" flags="ng" index="2czfm3">
        <child id="1140524464360" name="cellLayout" index="2czzBx" />
      </concept>
      <concept id="1106270549637" name="jetbrains.mps.lang.editor.structure.CellLayout_Horizontal" flags="nn" index="2iRfu4" />
      <concept id="1106270571710" name="jetbrains.mps.lang.editor.structure.CellLayout_Vertical" flags="nn" index="2iRkQZ" />
      <concept id="1080736578640" name="jetbrains.mps.lang.editor.structure.BaseEditorComponent" flags="ig" index="2wURMF">
        <child id="1080736633877" name="cellModel" index="2wV5jI" />
      </concept>
      <concept id="1186414536763" name="jetbrains.mps.lang.editor.structure.BooleanStyleSheetItem" flags="ln" index="VOi$J">
        <property id="1186414551515" name="flag" index="VOm3f" />
      </concept>
      <concept id="1186414928363" name="jetbrains.mps.lang.editor.structure.SelectableStyleSheetItem" flags="ln" index="VPM3Z" />
      <concept id="1233758997495" name="jetbrains.mps.lang.editor.structure.PunctuationLeftStyleClassItem" flags="ln" index="11L4FC" />
      <concept id="1233759184865" name="jetbrains.mps.lang.editor.structure.PunctuationRightStyleClassItem" flags="ln" index="11LMrY" />
      <concept id="1139848536355" name="jetbrains.mps.lang.editor.structure.CellModel_WithRole" flags="ng" index="1$h60E">
        <reference id="1140103550593" name="relationDeclaration" index="1NtTu8" />
      </concept>
      <concept id="1073389446423" name="jetbrains.mps.lang.editor.structure.CellModel_Collection" flags="sn" stub="3013115976261988961" index="3EZMnI">
        <child id="1106270802874" name="cellLayout" index="2iSdaV" />
        <child id="1073389446424" name="childCellModel" index="3EZMnx" />
      </concept>
      <concept id="1073389577006" name="jetbrains.mps.lang.editor.structure.CellModel_Constant" flags="sn" stub="3610246225209162225" index="3F0ifn">
        <property id="1073389577007" name="text" index="3F0ifm" />
      </concept>
      <concept id="1073389658414" name="jetbrains.mps.lang.editor.structure.CellModel_Property" flags="sg" stub="730538219796134133" index="3F0A7n" />
      <concept id="1219418625346" name="jetbrains.mps.lang.editor.structure.IStyleContainer" flags="ng" index="3F0Thp">
        <child id="1219418656006" name="styleItem" index="3F10Kt" />
      </concept>
      <concept id="1073390211982" name="jetbrains.mps.lang.editor.structure.CellModel_RefNodeList" flags="sg" stub="2794558372793454595" index="3F2HdR" />
      <concept id="1198256887712" name="jetbrains.mps.lang.editor.structure.CellModel_Indent" flags="ng" index="3XFhqQ" />
      <concept id="1166049232041" name="jetbrains.mps.lang.editor.structure.AbstractComponent" flags="ng" index="1XWOmA">
        <reference id="1166049300910" name="conceptDeclaration" index="1XX52x" />
      </concept>
    </language>
  </registry>
  <node concept="24kQdi" id="6uy13ANHtgM">
    <ref role="1XX52x" to="p7qg:6uy13ANHsDE" resolve="Date" />
    <node concept="3EZMnI" id="6uy13ANHtkl" role="2wV5jI">
      <node concept="3F0A7n" id="6uy13ANHtnX" role="3EZMnx">
        <ref role="1NtTu8" to="p7qg:6uy13ANHsVi" resolve="day" />
      </node>
      <node concept="2iRfu4" id="6uy13ANHtko" role="2iSdaV" />
      <node concept="3F0ifn" id="6uy13ANHtr$" role="3EZMnx">
        <property role="3F0ifm" value="/" />
        <node concept="11L4FC" id="6uy13ANHtVV" role="3F10Kt">
          <property role="VOm3f" value="true" />
        </node>
        <node concept="11LMrY" id="6uy13ANHtVW" role="3F10Kt">
          <property role="VOm3f" value="true" />
        </node>
      </node>
      <node concept="3F0A7n" id="6uy13ANHtyI" role="3EZMnx">
        <ref role="1NtTu8" to="p7qg:6uy13ANHsKH" resolve="month" />
      </node>
      <node concept="3F0ifn" id="6uy13ANHtHB" role="3EZMnx">
        <property role="3F0ifm" value="/" />
        <node concept="11L4FC" id="6uy13ANHtLf" role="3F10Kt">
          <property role="VOm3f" value="true" />
        </node>
        <node concept="11LMrY" id="6uy13ANHtSm" role="3F10Kt">
          <property role="VOm3f" value="true" />
        </node>
      </node>
      <node concept="3F0A7n" id="6uy13ANHtAp" role="3EZMnx">
        <ref role="1NtTu8" to="p7qg:6uy13ANHt2n" resolve="year" />
      </node>
    </node>
  </node>
  <node concept="24kQdi" id="6uy13ANHurQ">
    <ref role="1XX52x" to="p7qg:6uy13ANHuh8" resolve="Client" />
    <node concept="3EZMnI" id="6uy13ANHuvp" role="2wV5jI">
      <node concept="3EZMnI" id="6uy13ANHuz1" role="3EZMnx">
        <node concept="VPM3Z" id="6uy13ANHuz3" role="3F10Kt" />
        <node concept="3F0ifn" id="6uy13ANHuzb" role="3EZMnx">
          <property role="3F0ifm" value="client" />
        </node>
        <node concept="2iRfu4" id="6uy13ANHuz6" role="2iSdaV" />
        <node concept="3F0A7n" id="6uy13ANHuEj" role="3EZMnx">
          <ref role="1NtTu8" to="tpck:h0TrG11" resolve="name" />
        </node>
      </node>
      <node concept="3F0ifn" id="6uy13ANHuHS" role="3EZMnx" />
      <node concept="3F0ifn" id="6uy13ANHuLC" role="3EZMnx">
        <property role="3F0ifm" value="projects:" />
      </node>
      <node concept="3EZMnI" id="6uy13ANHuSW" role="3EZMnx">
        <node concept="VPM3Z" id="6uy13ANHuSY" role="3F10Kt" />
        <node concept="3XFhqQ" id="6uy13ANHuWI" role="3EZMnx" />
        <node concept="2iRfu4" id="6uy13ANHuT1" role="2iSdaV" />
        <node concept="3F2HdR" id="6uy13ANHvLF" role="3EZMnx">
          <ref role="1NtTu8" to="p7qg:6uy13ANHvEB" resolve="projects" />
          <node concept="2iRkQZ" id="6uy13ANHvPi" role="2czzBx" />
        </node>
      </node>
      <node concept="2iRkQZ" id="6uy13ANHuvs" role="2iSdaV" />
    </node>
  </node>
  <node concept="24kQdi" id="6uy13ANHvSY">
    <ref role="1XX52x" to="p7qg:6uy13ANHtZw" resolve="Project" />
    <node concept="3EZMnI" id="6uy13ANHvWx" role="2wV5jI">
      <node concept="3EZMnI" id="6uy13ANHw7i" role="3EZMnx">
        <node concept="2iRfu4" id="6uy13ANHw7j" role="2iSdaV" />
        <node concept="3F0ifn" id="6uy13ANH$OV" role="3EZMnx">
          <property role="3F0ifm" value="[" />
          <node concept="11LMrY" id="6uy13ANH_3h" role="3F10Kt">
            <property role="VOm3f" value="true" />
          </node>
        </node>
        <node concept="3F0A7n" id="6uy13ANH_at" role="3EZMnx">
          <ref role="1NtTu8" to="p7qg:6uy13ANH$AL" resolve="id" />
        </node>
        <node concept="3F0ifn" id="6uy13ANH$W7" role="3EZMnx">
          <property role="3F0ifm" value="]" />
          <node concept="11L4FC" id="6uy13ANH$ZI" role="3F10Kt">
            <property role="VOm3f" value="true" />
          </node>
        </node>
        <node concept="3F0ifn" id="6uy13ANHw09" role="3EZMnx">
          <property role="3F0ifm" value="project" />
        </node>
        <node concept="3F0A7n" id="6uy13ANHwi6" role="3EZMnx">
          <ref role="1NtTu8" to="tpck:h0TrG11" resolve="name" />
        </node>
      </node>
      <node concept="2iRkQZ" id="6uy13ANHvW$" role="2iSdaV" />
    </node>
  </node>
</model>

