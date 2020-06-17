package ExampleLanguage.intentions;

/*Generated by MPS */

import jetbrains.mps.intentions.AbstractIntentionDescriptor;
import jetbrains.mps.openapi.intentions.IntentionFactory;
import java.util.Collection;
import jetbrains.mps.openapi.intentions.IntentionExecutable;
import jetbrains.mps.openapi.intentions.Kind;
import jetbrains.mps.smodel.SNodePointer;
import org.jetbrains.mps.openapi.model.SNode;
import jetbrains.mps.openapi.editor.EditorContext;
import java.util.Collections;
import jetbrains.mps.intentions.AbstractIntentionExecutable;
import jetbrains.mps.internal.collections.runtime.ListSequence;
import jetbrains.mps.lang.smodel.generator.smodelAdapter.SLinkOperations;
import ExampleLanguage.behavior.Project__BehaviorDescriptor;
import jetbrains.mps.openapi.intentions.IntentionDescriptor;
import org.jetbrains.mps.openapi.language.SContainmentLink;
import jetbrains.mps.smodel.adapter.structure.MetaAdapterFactory;

public final class AssignStandardIDsToAllProjects_Intention extends AbstractIntentionDescriptor implements IntentionFactory {
  private Collection<IntentionExecutable> myCachedExecutable;
  public AssignStandardIDsToAllProjects_Intention() {
    super(Kind.NORMAL, true, new SNodePointer("r:a550b9c4-46d2-451c-905a-713398f611ff(ExampleLanguage.intentions)", "7467535778008439818"));
  }
  @Override
  public String getPresentation() {
    return "AssignStandardIDsToAllProjects";
  }
  @Override
  public boolean isApplicable(final SNode node, final EditorContext editorContext) {
    return true;
  }
  @Override
  public boolean isSurroundWith() {
    return false;
  }
  public Collection<IntentionExecutable> instances(final SNode node, final EditorContext context) {
    if (myCachedExecutable == null) {
      myCachedExecutable = Collections.<IntentionExecutable>singletonList(new IntentionImplementation());
    }
    return myCachedExecutable;
  }
  /*package*/ final class IntentionImplementation extends AbstractIntentionExecutable {
    public IntentionImplementation() {
    }
    @Override
    public String getDescription(final SNode node, final EditorContext editorContext) {
      return "Assign Standard ID to All Projects";
    }
    @Override
    public void execute(final SNode node, final EditorContext editorContext) {
      for (SNode p : ListSequence.fromList(SLinkOperations.getChildren(node, LINKS.projects$aWB5))) {
        Project__BehaviorDescriptor.assignStandardID_id6uy13ANHEIb.invoke(p);
      }
    }
    @Override
    public IntentionDescriptor getDescriptor() {
      return AssignStandardIDsToAllProjects_Intention.this;
    }
  }

  private static final class LINKS {
    /*package*/ static final SContainmentLink projects$aWB5 = MetaAdapterFactory.getContainmentLink(0x76323df9b7464f38L, 0xa295fd089a3e40d4L, 0x67a20439b3b5e448L, 0x67a20439b3b5faa7L, "projects");
  }
}