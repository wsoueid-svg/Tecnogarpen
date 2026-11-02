import { Suspense } from "react";
import { isFileDataBackend } from "../data/reset-demo";
import { resetDemo } from "../server/demo-actions";
import { ResetNotice } from "./reset-notice";

export async function ResetDemo({
  next,
  tone = "paper",
  compact = false,
}: {
  next: string;
  tone?: "paper" | "rail";
  compact?: boolean;
}) {
  const local = isFileDataBackend();

  return (
    <div className={tone === "rail" ? "reset-demo reset-demo-rail" : "reset-demo"}>
      {local ? (
        <form action={resetDemo}>
          <input type="hidden" name="next" value={next} />
          <button type="submit">Reset demo</button>
        </form>
      ) : null}
      <Suspense fallback={null}>
        <ResetNotice compact={compact || !local} />
      </Suspense>
    </div>
  );
}
