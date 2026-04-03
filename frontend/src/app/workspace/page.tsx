import { ProtectedRoute } from "@/components/auth/protected-route";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <WorkspaceShell />
    </ProtectedRoute>
  );
}
