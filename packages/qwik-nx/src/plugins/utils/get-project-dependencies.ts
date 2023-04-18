import { ProjectGraph, createProjectGraphAsync } from '@nrwl/devkit';
import { pruneExternalNodes } from 'nx/src/project-graph/operators';

/** Retrieves all projects given `currentProjectName` depends on */
export async function getProjectDependencies(
  currentProjectName: string
): Promise<ReadonlySet<string>> {
  const graph = pruneExternalNodes(
    await createProjectGraphAsync({ exitOnError: true })
  );
  return traverseGraph(graph, currentProjectName);
}

function traverseGraph(
  graph: ProjectGraph,
  root: string,
  visited = new Set<string>()
) {
  if (visited.has(root)) return visited;

  visited.add(root);
  const nodes = graph.dependencies[root].map((d) => d.target);

  for (const node of nodes) {
    traverseGraph(graph, node, visited);
  }
  return visited;
}
