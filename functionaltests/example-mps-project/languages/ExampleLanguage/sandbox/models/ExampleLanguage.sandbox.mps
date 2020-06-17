<?xml version="1.0" encoding="UTF-8"?>
<model ref="r:9903d408-e161-4729-a60e-f52886dd6762(ExampleLanguage.sandbox)">
  <persistence version="9" />
  <languages>
    <use id="76323df9-b746-4f38-a295-fd089a3e40d4" name="ExampleLanguage" version="0" />
  </languages>
  <imports />
  <registry>
    <language id="ceab5195-25ea-4f22-9b92-103b95ca8c0c" name="jetbrains.mps.lang.core">
      <concept id="1169194658468" name="jetbrains.mps.lang.core.structure.INamedConcept" flags="ng" index="TrEIO">
        <property id="1169194664001" name="name" index="TrG5h" />
      </concept>
    </language>
    <language id="76323df9-b746-4f38-a295-fd089a3e40d4" name="ExampleLanguage">
      <concept id="7467535778008391648" name="ExampleLanguage.structure.Project" flags="ng" index="3k5XJp">
        <property id="7467535778008418737" name="id" index="3k54Q8" />
      </concept>
      <concept id="7467535778008392776" name="ExampleLanguage.structure.Client" flags="ng" index="3k5Y1L">
        <child id="7467535778008398503" name="projects" index="3k5ZUu" />
      </concept>
    </language>
  </registry>
  <node concept="3k5Y1L" id="6uy13ANH$72">
    <property role="TrG5h" value="Acme" />
    <node concept="3k5XJp" id="6uy13ANH$e5" role="3k5ZUu">
      <property role="TrG5h" value="Build DSL" />
      <property role="3k54Q8" value="ACME-1" />
    </node>
    <node concept="3k5XJp" id="6uy13ANH$oE" role="3k5ZUu">
      <property role="TrG5h" value="Refactor Compiler" />
      <property role="3k54Q8" value="ACME-2" />
    </node>
  </node>
</model>

