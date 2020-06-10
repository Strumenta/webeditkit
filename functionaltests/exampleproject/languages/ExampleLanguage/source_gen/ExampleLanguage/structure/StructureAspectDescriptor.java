package ExampleLanguage.structure;

/*Generated by MPS */

import jetbrains.mps.smodel.runtime.BaseStructureAspectDescriptor;
import jetbrains.mps.smodel.runtime.ConceptDescriptor;
import java.util.Collection;
import java.util.Arrays;
import org.jetbrains.annotations.Nullable;
import jetbrains.mps.smodel.adapter.ids.SConceptId;
import jetbrains.mps.smodel.runtime.DataTypeDescriptor;
import org.jetbrains.mps.openapi.language.SAbstractConcept;
import jetbrains.mps.smodel.runtime.impl.ConceptDescriptorBuilder2;
import jetbrains.mps.smodel.adapter.ids.PrimitiveTypeId;

public class StructureAspectDescriptor extends BaseStructureAspectDescriptor {
  /*package*/ final ConceptDescriptor myConceptClient = createDescriptorForClient();
  /*package*/ final ConceptDescriptor myConceptDate = createDescriptorForDate();
  /*package*/ final ConceptDescriptor myConceptProgressReport = createDescriptorForProgressReport();
  /*package*/ final ConceptDescriptor myConceptProject = createDescriptorForProject();
  private final LanguageConceptSwitch myIndexSwitch;

  public StructureAspectDescriptor() {
    myIndexSwitch = new LanguageConceptSwitch();
  }


  @Override
  public void reportDependencies(jetbrains.mps.smodel.runtime.StructureAspectDescriptor.Dependencies deps) {
    deps.extendedLanguage(0xceab519525ea4f22L, 0x9b92103b95ca8c0cL, "jetbrains.mps.lang.core");
  }

  @Override
  public Collection<ConceptDescriptor> getDescriptors() {
    return Arrays.asList(myConceptClient, myConceptDate, myConceptProgressReport, myConceptProject);
  }

  @Override
  @Nullable
  public ConceptDescriptor getDescriptor(SConceptId id) {
    switch (myIndexSwitch.index(id)) {
      case LanguageConceptSwitch.Client:
        return myConceptClient;
      case LanguageConceptSwitch.Date:
        return myConceptDate;
      case LanguageConceptSwitch.ProgressReport:
        return myConceptProgressReport;
      case LanguageConceptSwitch.Project:
        return myConceptProject;
      default:
        return null;
    }
  }

  @Override
  public Collection<DataTypeDescriptor> getDataTypeDescriptors() {
    return Arrays.asList();
  }

  /*package*/ int internalIndex(SAbstractConcept c) {
    return myIndexSwitch.index(c);
  }

  private static ConceptDescriptor createDescriptorForClient() {
    ConceptDescriptorBuilder2 b = new ConceptDescriptorBuilder2("ExampleLanguage", "Client", 0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5e448L);
    b.class_(false, false, true);
    b.parent(0xceab519525ea4f22L, 0x9b92103b95ca8c0cL, 0x110396eaaa4L);
    b.origin("r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)/7467535778008392776");
    b.version(2);
    b.aggregate("projects", 0x67a20439b3b5faa7L).target(0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5dfe0L).optional(true).ordered(true).multiple(true).origin("7467535778008398503").done();
    return b.create();
  }
  private static ConceptDescriptor createDescriptorForDate() {
    ConceptDescriptorBuilder2 b = new ConceptDescriptorBuilder2("ExampleLanguage", "Date", 0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5ca6aL);
    b.class_(false, false, false);
    b.origin("r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)/7467535778008386154");
    b.version(2);
    b.property("day", 0x67a20439b3b5ced2L).type(PrimitiveTypeId.INTEGER).origin("7467535778008387282").done();
    b.property("month", 0x67a20439b3b5cc2dL).type(PrimitiveTypeId.INTEGER).origin("7467535778008386605").done();
    b.property("year", 0x67a20439b3b5d097L).type(PrimitiveTypeId.INTEGER).origin("7467535778008387735").done();
    return b.create();
  }
  private static ConceptDescriptor createDescriptorForProgressReport() {
    ConceptDescriptorBuilder2 b = new ConceptDescriptorBuilder2("ExampleLanguage", "ProgressReport", 0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5c8a7L);
    b.class_(false, false, false);
    b.origin("r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)/7467535778008385703");
    b.version(2);
    return b.create();
  }
  private static ConceptDescriptor createDescriptorForProject() {
    ConceptDescriptorBuilder2 b = new ConceptDescriptorBuilder2("ExampleLanguage", "Project", 0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5dfe0L);
    b.class_(false, false, false);
    b.parent(0xceab519525ea4f22L, 0x9b92103b95ca8c0cL, 0x110396eaaa4L);
    b.origin("r:7fc5c4eb-b9c5-4ae6-a4b6-fd405d3cde25(ExampleLanguage.structure)/7467535778008391648");
    b.version(2);
    b.property("id", 0x67a20439b3b649b1L).type(PrimitiveTypeId.STRING).origin("7467535778008418737").done();
    return b.create();
  }
}
